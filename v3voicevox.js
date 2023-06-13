class TtsQuestV3Voicevox extends Audio {
  mainResponse; downloadElement; audioStatus;
  onStreamingReady; onError; onReTry;
  constructor(speakerId, text, ttsQuestApiKey) {
    super();
    this.#genDlElmInit();
    this.onStreamingReady = this.onError = this.onReTry = function(){};
    this.audioStatus = {
      success: false,
      isAudioReady: false,
      isAudioError: false,
    };
    var params = {};
    params['key'] = ttsQuestApiKey;
    params['speaker'] = speakerId;
    params['text'] = text;
    const query = new URLSearchParams(params);
    this.#main(this, query);
  }
  #main(owner, query) {
    if (owner.src.length>0) return;
    var apiUrl = 'https://api.tts.quest/v3/voicevox/synthesis';
    fetch(apiUrl + '?' + query.toString())
    .then(response => response.json())
    .then(response => {
      if (typeof response.retryAfter !== 'undefined') {
        owner.onReTry();
        setTimeout(owner.#main, 1000*(1+response.retryAfter), owner, query);
      }
      else if (typeof response.mp3StreamingUrl !== 'undefined') {
        owner.mainResponse = response;
        owner.src = response.mp3StreamingUrl;
        owner.onStreamingReady();
      }
      else if (typeof response.errorMessage !== 'undefined') {
        owner.onError();
        throw new Error(response.errorMessage);
      }
      else {
        owner.onError();
        throw new Error("serverError");
      }
    });
  }
  updateAudioStatus() {
    if (typeof this.mainResponse.audioStatusUrl === 'undefined') {
      return;
    }
    fetch(this.mainResponse.audioStatusUrl)
    .then(response => response.json())
    .then(response => {
      if (typeof response.success === 'undefined') {
        return;
      }
      if (response.success) {
        this.audioStatus = response;
      }
    });
  }
  #genDlElmInit() {
    this.downloadElement = document.createElement('span');
    this.downloadElement.voicevox = this;
    this.downloadElement.innerHTML = this.indicatorText.download;
    this.downloadElement.indicatorText = {
      download: "Download", 
      preparing: "Preparing...",
      wav: "wav",
      separator: " | ",
      mp3: "mp3",
      error: "Error",
      text: text
    };
    
    // copy the style of <a> tag to downloadElement
    var tempLink = document.createElement('a');
    tempLink.href = 'colorOfNewLink';
    document.body.appendChild(tempLink);
    var computedStyle = getComputedStyle(tempLink);
    var spanStyle = this.downloadElement.style;
    this.downloadElement.style.color = computedStyle.color;
    this.downloadElement.style.cursor = computedStyle.cursor;
    this.downloadElement.style["text-decoration"] = computedStyle["text-decoration"];
    document.body.removeChild(tempLink);
    
    //functions of downloadElement
    this.downloadElement.onclick = function() {
      this.onclick = undefined;
      this.checkCount = 0;
      this.checkDownload(this);
    }
    this.downloadElement.checkDownload = function(owner) {
      if (owner.voicevox.audioStatus.isAudioError) {
        owner.innerHTML = owner.voicevox.indicatorText.error;
        return;
      }
      if (owner.voicevox.audioStatus.isAudioReady) {
        var wav = document.createElement('a');
        var mp3 = document.createElement('a');
        var separator = document.createElement('b');
        wav.href = owner.voicevox.mainResponse.wavDownloadUrl;
        mp3.href = owner.voicevox.mainResponse.mp3DownloadUrl;
        wav.innerHTML = owner.voicevox.indicatorText.wav;
        mp3.innerHTML = owner.voicevox.indicatorText.mp3;
        var fileName = owner.voicevox.indicatorText.text + "_";
        wav.download = mp3.download = "";
        wav.target = mp3.target = "_blank";
        separator.innerHTML = owner.voicevox.indicatorText.separator;
        owner.innerHTML = "";
        owner.style.cssText = "";
        owner.appendChild(wav);
        owner.appendChild(separator);
        owner.appendChild(mp3);
        return;
      }
      owner.voicevox.updateAudioStatus();
      var preparing = owner.voicevox.indicatorText.preparing;
      owner.innerHTML = preparing+' ('+owner.checkCount+')';
      owner.checkCount++;
      setTimeout(owner.checkDownload, 1000, owner);
    }
  }
}
