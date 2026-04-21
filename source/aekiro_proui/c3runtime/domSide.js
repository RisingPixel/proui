"use strict";

{
	const DOM_COMPONENT_ID = "aekiro_proui_dom";
	const AUDIO_EXTENSIONS = [".webm", ".ogg", ".m4a", ".mp3", ".wav", ".aac"];

	const dbToLinear = db => Math.pow(10, (db || 0) / 20);

	const HANDLER_CLASS = class AekiroProuiDOMHandler extends DOMHandler
	{
		constructor(iRuntime)
		{
			super(iRuntime, DOM_COMPONENT_ID);

			this._audioContext = null;
			this._bufferCache = new Map();
			this._pendingLoads = new Map();

			this.AddRuntimeMessageHandlers([
				["audio-preload", data => this._OnAudioPreload(data)],
				["audio-play", data => this._OnAudioPlay(data)]
			]);
		}

		_GetAudioContext()
		{
			if (!this._audioContext) {
				const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
				if (!AudioContextCtor) {
					throw new Error("AudioContext is not available in DOM side.");
				}
				this._audioContext = new AudioContextCtor();
			}

			return this._audioContext;
		}

		_NormalizeAssetUrl(fileName)
		{
			if (!fileName) {
				return "";
			}

			if (/^(?:https?:|data:|blob:|\/)/i.test(fileName) || fileName.indexOf("media/") === 0) {
				return fileName;
			}

			return new URL("media/" + fileName, document.baseURI).toString();
		}

		_GetCandidateAssetUrls(fileName)
		{
			const baseUrl = this._NormalizeAssetUrl(fileName);
			if (!baseUrl) {
				return [];
			}

			if (/\.[a-z0-9]+(?:[\?#].*)?$/i.test(fileName)) {
				return [baseUrl];
			}

			const urls = [];
			urls.push(baseUrl);
			for (const ext of AUDIO_EXTENSIONS) {
				urls.push(this._NormalizeAssetUrl(fileName + ext));
			}

			return urls;
		}

		async _LoadAudioBuffer(fileName)
		{
			if (this._bufferCache.has(fileName)) {
				return this._bufferCache.get(fileName);
			}

			if (this._pendingLoads.has(fileName)) {
				return this._pendingLoads.get(fileName);
			}

			const loadPromise = (async () => {
				const audioContext = this._GetAudioContext();
				const candidateUrls = this._GetCandidateAssetUrls(fileName);
				let response = null;

				for (const url of candidateUrls) {
					response = await fetch(url);
					if (response.ok) {
						break;
					}
					response = null;
				}

				if (!response) {
					throw new Error("Could not fetch audio file: " + fileName);
				}

				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
				this._bufferCache.set(fileName, audioBuffer);
				this._pendingLoads.delete(fileName);
				return audioBuffer;
			})().catch(err => {
				this._pendingLoads.delete(fileName);
				throw err;
			});

			this._pendingLoads.set(fileName, loadPromise);
			return loadPromise;
		}

		async _OnAudioPreload(data)
		{
			if (!data || !data.fileName) {
				return;
			}

			try {
				await this._LoadAudioBuffer(data.fileName);
			}
			catch (err) {
				this._ReportError(err);
			}
		}

		async _OnAudioPlay(data)
		{
			if (!data || !data.fileName) {
				return;
			}

			try {
				const audioContext = this._GetAudioContext();
				if (audioContext.state === "suspended") {
					await audioContext.resume();
				}

				const audioBuffer = await this._LoadAudioBuffer(data.fileName);
				const source = audioContext.createBufferSource();
				const gainNode = audioContext.createGain();

				gainNode.gain.value = dbToLinear(data.volume);
				source.buffer = audioBuffer;
				source.connect(gainNode);
				gainNode.connect(audioContext.destination);
				source.start(0);
			}
			catch (err) {
				this._ReportError(err);
			}
		}

		_ReportError(err)
		{
			const message = err && err.message ? err.message : String(err);
			if (this.PostToRuntime) {
				this.PostToRuntime("audio-error", {
					message
				});
			}
			else {
				console.error("ProUI: Failed to play audio. " + message);
			}
		}
	};

	RuntimeInterface.AddDOMHandlerClass(HANDLER_CLASS);
}
