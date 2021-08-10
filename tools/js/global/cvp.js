/* TVE tracking variables */
var video_progressMarker = "0:content";
var video_progressMarkerNum = 0;
var isvideoComplete_flg = false;
var isvidperct100 = false;
var tveModeGlobal = '';
var vidObject = '';
var vidObjectJSON = '';

/*CVP Init*/
function CvpPlayer(videoid){

    var self = this;    
    var autoStartVideo = 'true';
    var closeVideoBound = false;
    if (_mixelglobal.isMobileApp === true){
        if (typeof videoid != 'undefined'){
            var cnvideoid = videoid;
        }    
    } else {
        if (typeof _mixelglobal.cvpVideoId != 'undefined'){
            var cnvideoid = _mixelglobal.cvpVideoId;
        }    
    }    
    /* force html5 player for Android/Kindle */
    if (_mixelglobal.device.deviceName === 'Android' || _mixelglobal.device.deviceName === 'Kindle'){
        var playerType = 'html5';           
    }
    player = new CVP({ 
        id : 'cvp_1',
        width : '100%', 
        height : '100%',
        playerType : playerType,
        flashVars : {
           context : 'mixel_player', 
           autostart : autoStartVideo,
           site : 'cn', 
           profile : _mixelglobal.cvpProfile,  
           contentId : cnvideoid
       },
        embed : {
            containerSwf : 'http://z.cdn.turner.com/xslo/cvp/assets/container/2.0.4.0/cvp_main_container.swf',
            expressInstallSwf : 'http://i.cdn.turner.com/xslo/cvp/assets/flash/expressInstall.swf',
            options : {
                wmode : 'transparent',          
                quality : 'high',
                bgcolor : '#000000',
                allowFullScreen : 'true', 
                allowScriptAccess : 'always'                    
            }
        },
        onContentBegin: function (playerId, videoId, json, tveMode) {
            try{
                jsmd.TVE.lastPlayHeadTime= 0;
                jsmd.TVE.nonC3C4adNum = 0;
                jsmd.TVE.allAdIntervlNum = 0;
                jsmd.TVE.isAdStart = false;
                jsmd.TVE.adIntervalsCount = 0;
                jsmd.TVE.adDuration = 0;
                jsmd.TVE.totalAdDurations = 0;
                jsmd.TVE.event22cal = 0;
                jsmd.TVE.prevAdEvent22 = 0;
            }catch(e){}
            vidObjectJSON = player.getContentEntry(videoId);
            vidObject = eval('(' + vidObjectJSON.toString().replace(/\n/g,' ').replace(/\r/g,' ') + ')');
            /* ************************************ */
            // quick fix for reporting; remove this when the services get updated
            if (videoId == '236809' || videoId == '397696') {
                vidObject.tveMode = "liveTVE";
                if (videoId == '236809') {
                    vidObject.headline = "East coast live stream";
                }
                if (videoId == '397696') {
                    vidObject.headline = "West coast live stream";
                }
            }
            /* ************************************ */
            tveModeGlobal = (vidObject.tveMode)?vidObject.tveMode:"";
            if (tveModeGlobal === "") {tveModeGlobal = 'clip'; }
            if (vidObject.tveMode == 'C3') {
                player.switchTrackingContext('short_interval_c3');
            } else if (vidObject.tveMode == 'C4') {
                player.switchTrackingContext('short_interval_c4');
            } else {
                player.switchTrackingContext('clips');
            }
            
            bitRateJson = player.getAvailableBitrates('window');

            if (bitRateJson != null) {
                for ( var i = 0; i < bitRateJson.length; i++) {
                    if (bitRateJson[i].label == "standard") {
                        standardBitrateId = bitRateJson[i].rateId;
                    } else if (bitRateJson[i].label == "hq") {
                        hqBitrateId = bitRateJson[i].rateId;
                    }
                }
            }
        },
        onContentValidationFailure: function (playerId, contentId, errorType, dataObj) {
            if (errorType == "networkBlackout") {
                try {
                    vidObject.blackoutType = "network blackout";
                    TVE_VideoEvent(vidObject, "tve-live_video-blackout");
                } catch (e) {}
            } else if (errorType == "blackout") {
                document.getElementById("slate").style.visibility = "visible";
                try {
                    vidObject.blackoutType = "regional blackout";
                    TVE_VideoEvent(vidObject, "tve-live_video-blackout");
                } catch (e) {}
            }
        },
        onTrackingContentPlay: function (_playerId, _dataObj) {
            try {
                isvideoComplete_flg = false;
                video_progressMarkerNum = 0;
                isvidperct100 = false;
                if (tveModeGlobal == "liveTVE") {
                    TVE_VideoEvent(vidObject, "tve-live_video-start");
                } else {
                    if (tveModeGlobal != 'clip') {
                        var vidObj = {};
                        if (typeof (vidObject) == "object") {
                            vidObj = vidObject;
                        }
                        if (_dataObj["length"]) {
                            vidObj.duration = _dataObj["length"];
                        }
                        if (_dataObj.grossLength) {
                            vidObj.grossLength = _dataObj.grossLength;
                        }
                        if (_dataObj.totalPlayTime) {
                            vidObj.totalPlayTime = _dataObj.totalPlayTime;
                        }
                        if (_dataObj.adTotalPlayTime) {
                            vidObj.adTotalPlayTime = _dataObj.adTotalPlayTime;
                        }
                        TVE_VideoEvent(vidObject, "video-start");
                    }
                }
            } catch (e) {}
        },
        onContentPlay: function (playerId, contentId) {
            log('onContentPlay');
			
			if(typeof(postPlayVoteAPI) == "function"){ 
				postPlayVoteAPI();
			}
			
            if (_mixelglobal.device.deviceOS === "iOS" || _mixelglobal.device.deviceOS === "Android" || _mixelglobal.device.deviceOS === "Kindle"){
                    _cvpInstance.video = document.getElementById('cvp_1');
                    _cvpInstance.video.addEventListener('ended', _cvpInstance.mobileEndVideo, false);
                    _cvpInstance.video.addEventListener('pause', _cvpInstance.mobilePauseVideo, false);    
                    _cvpInstance.video.addEventListener('webkitDisplayingFullscreen', _cvpInstance.mobileFullScreenMobile, false);   
                    _cvpInstance.video.addEventListener('webkitendfullscreen', _cvpInstance.mobileFullScreenOff, false);
            }                 

            if (tveModeGlobal == 'clip') {
                try {   
                    var vdata = this.getContentEntry(contentId);
                    vdata = window.JSON.parse(vdata);   /*this vdata will contain the standard cvp data (id, title, trt, etc.)*/
                    vdata.autoplayed = player.options.flashVars.autostart;       
                    if(_mixelglobal.cvpClipType === 'TVE'){
                        vdata.type = 'EPI';
                    } else {
                        vdata.type = _mixelglobal.cvpClipType;
                    }                       
                    vdata.franchise = vdata.showTitle;
                    vdata.segment = _mixelglobal.cvpClipSegment;
                    vdata.season = vdata.seasonNumber;
                    vdata.episode = _mixelglobal.cvpEpisodeId;
                    trackVideo("video-start", vdata, playerId);
                } catch(e) {}
            }
        },
        onContentPause: function (playerId, contentId, paused) {
            if (tveModeGlobal == 'liveTVE') {
                TVE_VideoEvent(vidObject, "tve-live_video-pause");
            } else if (tveModeGlobal == 'clip') {
                try {
                    var vdata = this.getContentEntry(contentId);
                    vdata = window.JSON.parse(vdata);
                    vdata.paused = paused;              
                    trackVideo("video-pause", vdata, playerId);
                } catch(e) {}
            }
        },
        onContentBuffering: function (playerId, contentId, buffering) {
            if (tveModeGlobal == 'clip') {
                try {
                    var vdata = this.getContentEntry(contentId);                                
                    vdata = window.JSON.parse(vdata);
                    vdata.buffering = buffering;
                    trackVideo("video-buffer", vdata, playerId);
                } catch(e) {}
            }
        },
        onTrackingContentSeek: function (playerId, contentId) {
            log('onTrackingContentSeek');
            if (tveModeGlobal == 'clip') {
                try {
                    var vdata = this.getContentEntry(contentId);
                    vdata = window.JSON.parse(vdata);
                    trackVideo("video-scrub", vdata, playerId);
                } catch(e) {}
            }
        },
        onPlayerReady : function (){
            log('onPlayerReady');
            /* if closeVideoBound is false attach click event (so it's only bound once) */
            if (_mixelglobal.isMobileApp === true){
                if (closeVideoBound === false){
                    log('setcloseVideo');
                    mixelsAppVideo.setCloseVideo();
                }            
            } else {    
                log('player play auth video');
                player.play(_mixelglobal.cvpVideoId);
            }
            // assign a player type value for adbp - jsmd.adbpsupplement.js
            if (typeof cnt_metadata == "object") {
                cnt_metadata.player_type = player._playerType;
            }
        },    
        onAdPlay : function(playerId, _token, _mode, _id, _duration, _segmentId, _adType) {
            log('onAdPlay');
            if (tveModeGlobal == 'liveTVE') {
                TVE_VideoEvent(vidObject, "tve-live_ad-start");
            } else if (tveModeGlobal == "clip") {
                trackVideo("video-preroll", vidObject, playerId);
            } else {
                TVE_VideoEvent(vidObject, "ad-start");
            }
            $('#ad-video-label').addClass('active');                       
            if (_mixelglobal.device.deviceName !== 'DesktopOthers'){
                $('#ad-video-label').html('<span class="ad-video-label-title">Advertisement</span> - Your video will begin after the advertisement');
            }
        },
        onTrackingAdProgress: function(_playerId,_dataObj){
            if (tveModeGlobal && tveModeGlobal !== "clip" && tveModeGlobal !== "liveTVE") {
                TVE_VideoEvent(vidObject, "ad-progress");
            }
        },
        onAdEnd : function() { 
            log('onAdEnd');
            if (tveModeGlobal == 'liveTVE') {
                TVE_VideoEvent(vidObject, "tve-live_ad-complete");
            }
            $('#ad-video-label').removeClass('active');         
            /* fix for kindle 1 bug where after first video plays (ad or content) - controls for the video object get set to false*/
            if (_mixelglobal.device.deviceOS === "Kindle"){
                log('onAdEnd - Kindle');
                if(typeof _cvpInstance.video == 'undefined'){
                    log('onAdEnd - video obj undefined');
                    _cvpInstance.video = document.getElementById('cvp_1');
                    _cvpInstance.video.controls = true;
                }                
                if (_cvpInstance.video.controls === false){
                    log('onAdEnd - set video obj controls to true');
                    _cvpInstance.video.controls = true;
                }
            }                        

        },  
        onTrackingAdStart: function(playerId, dataObj) {
        },  
        onTrackingAdComplete : function(playerId, dataObj) {
        },
        onTrackingAdCountdown : function(playerId, dataObj) {
            if (tveModeGlobal == 'C4') {
                var secs = dataObj.secs;
                var duration = jsmd.TVE.adDuration;
                if (duration > secs && (duration - secs) % 60 == 0) {
                    TVE_VideoEvent(vidObject, "ad-progress");
                }
            }
            if (_mixelglobal.device.deviceName === 'DesktopOthers'){
                $('#ad-video-label').html('<span class="ad-video-label-title">Advertisement</span> - Your video will begin in ' + dataObj.secs + ' seconds');
            }
        },           
        onTrackingFullscreen: function(playerId, dataObj) {
        },
        onTrackingContentComplete: function(playerId, dataObj){
            isvideoComplete_flg = true;
            if (tveModeGlobal != 'clip' && tveModeGlobal != "liveTVE") {
                var vidObj = {};
                if (typeof(vidObject)=="object") {
                    vidObj = vidObject;
                }
                isvideoComplete_flg = true;
                if (dataObj.percent) {
                    vidObj.percent = dataObj.percent;
                }
                if (dataObj.totalPlayTime) {
                    vidObj.totalPlayTime = dataObj.totalPlayTime;
                }
                if (dataObj.playheadTime) {
                    vidObj.playheadTime = dataObj.playheadTime;
                }
                if (dataObj.progressMarker) {
                    vidObj.progressMarker = dataObj.progressMarker;
                }
                if (dataObj.grossProgressMarker) {
                    vidObj.grossProgressMarker = dataObj.grossProgressMarker;
                }
                if (dataObj.adTotalPlayTime) {
                    vidObj.adTotalPlayTime = dataObj.adTotalPlayTime;
                }
                TVE_VideoEvent(vidObj, "video-complete");
            }
        },
        onContentEnd: function (playerId, contentId) {
            log('onContentEnd');
            /* only continue playing videos if on a desktop (people don't like when you use their bandwidth infinitely) */
            if ( _mixelglobal.device.deviceName === 'DesktopOthers' && _mixelglobal.isMobileApp === false){
                self.redirectToNextVideo();                
            } else {
                self.endSlate();
            }

            if (tveModeGlobal == 'clip') {
                try {
                    var vdata = this.getContentEntry(contentId);
                    vdata = window.JSON.parse(vdata);
                    vdata.autoplayed = player.options.flashVars.autostart;
                    if(_mixelglobal.cvpClipType === 'TVE'){
                        vdata.type = 'EPI';
                    } else {
                        vdata.type = _mixelglobal.cvpClipType;
                    }                       
                    vdata.franchise = vdata.showTitle;
                    vdata.segment = _mixelglobal.cvpClipSegment;
                    vdata.season = vdata.seasonNumber;
                    vdata.episode = _mixelglobal.cvpEpisodeId;
                    trackVideo("video-complete", vdata, playerId);
                } catch(e) {}
            }
            /* fix for kindle 1 bug where after first video plays (ad or content) - controls for the video object get set to false*/
            if (_mixelglobal.device.deviceOS === "Kindle"){
                log('onContentEnd - Kindle');
                if(typeof _cvpInstance.video == 'undefined'){
                    log('onContentEnd - video obj undefined');
                    _cvpInstance.video = document.getElementById('cvp_1');
                    _cvpInstance.video.controls = true;
                }                
                if (_cvpInstance.video.controls === false){
                    log('onContentEnd - set video obj controls to true');
                    _cvpInstance.video.controls = true;
                }
            }             
        },
        onTrackingContentProgress: function(playerId, dataObj){
            /*VideoAchievementModule.trackingContentProgress(dataObj.percent);*/ 
            if (tveModeGlobal != 'clip' && tveModeGlobal != "liveTVE") {
                var vidObj = {};
                if (typeof (vidObject) == "object") {
                    vidObj = vidObject;
                }
                if (!isvideoComplete_flg) {
                    if (dataObj.percent) {
                        vidObj.percent = dataObj.percent;
                    }
                    if (dataObj.totalPlayTime) {
                        vidObj.totalPlayTime = dataObj.totalPlayTime;
                    }
                    if (dataObj.playheadTime) {
                        vidObj.playheadTime = dataObj.playheadTime;
                    }
                    if (dataObj.progressMarker) {
                        vidObj.progressMarker = dataObj.progressMarker;
                    }
                    if (dataObj.grossProgressMarker) {
                        vidObj.grossProgressMarker = dataObj.grossProgressMarker;
                    }
                    if (dataObj.adTotalPlayTime) {
                        vidObj.adTotalPlayTime = dataObj.adTotalPlayTime;
                    }
                    TVE_VideoEvent(vidObj, "video-progress");
                }
            }
        }
        
    });


    this.redirectToNextVideo = function(){
        window.location.href = '' + _mixelglobal.videoNextClip.nextClipURL;       
    }

    this.endSlate = function (){
        if (_mixelglobal.device.deviceName !== 'iPhone') {
            log('inside endSlate function');
            $('#cvp_1').addClass('hidden');
            $('#video-slate').addClass('active');
        }    
    }

    this.mobileFullScreenOff = function(){
        //if video has ended and iOS player is not full screen
        log('mobileFullScreenOff');
        if(cvp_1.ended == true && cvp_1.webkitDisplayingFullscreen == false){
            log('mobileFullScreenOff - show end slate');
            //get end slate
            self.endSlate();
        }       
    }   
    
    this.mobileEndVideo = function(){
        log('mobileEndVideo');
        //if iOS player is not full screen
        if (cvp_1.webkitDisplayingFullscreen != true){  
            log('mobileEndVideo - show end slate');  
            //get end slate
            self.endSlate();
        } else if (_mixelglobal.device.deviceOS == 'Kindle'){
            log('mobileEndVideo - show end slate Kindle');  
            self.endSlate();
        }
    }
    this.mobileFullScreenMobile = function(){
        log('mobileFullScreenMobile');
        //for event listener
    }


    /* embed player if function is initialized */
    player.embed('playerarea');
}

