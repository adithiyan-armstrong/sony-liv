// Response TYPE
const RESPONSE_TYPE = {
    POST: 'POST',
    GET: 'GET'
};

//API Endpoints
const scoreAPIEndpoint = 'https://stg-api-games.sonyliv.com/score-api';
const adsAPIEndpoint = 'https://stg-api-games.sonyliv.com/manage_ads/index_v2/';

// Content Type
const contentType = 'application/x-www-form-urlencoded';

// Ads API Response
var adsAPIresponse = null;

//score data for API
var userid = "15151515999"; // Random user ID
var gameid = "193"; //Might change from time to time
var score = "65"; // Random Score

// ads data format
var adsData = {
    v_ads: {
        url: "",
        s: 0
    },
    i_ads: {
        url: "",
        s: 0,
        ad_size: []
    }
}

// ads repsonse from API
var adsResponseData = {
    start_game: adsData,
    in_game: adsData,
    revive: adsData,
    reward: adsData,
    exit: adsData
};

// To check if the ad api is initialized
var adsAPIInitialized = false;

var videoContent = document.getElementById('contentElement');
var adDisplayContainer;
var adsLoader;
var adsManager;

function initAPI() {
    // Init API
    initializedAdAPIRequest();

    // Making the ads Manager Responsive
    // window.addEventListener('resize', function(event) {
    //     console.log("window resized");
    //     if (adsManager) {
    //         var width = videoElement.clientWidth;
    //         var height = videoElement.clientHeight;
    //         adsManager.resize(width, height, google.ima.ViewMode.NORMAL);
    //     }
    // });
};

function setUpGPT() {


        window.googletag = window.googletag || { cmd: [] };
        googletag.cmd.push(function() {        
        googletag.defineSlot('/6355419/Travel/Europe/France/Paris',[300,250],'interstitial-ad')  
        .addService(googletag.pubads());
        googletag.enableServices();
         });
         
        // window.googletag = window.googletag || { cmd: [] };
        // googletag.cmd.push(function () {
        //      googletag.defineSlot(adsResponseData.start_game.i_ads.url, adsResponseData.start_game.i_ads.ad_size,'interstitial-ad')
        //      .addService(googletag.pubads());
        //     googletag.enableServices();
        // });
    
};

function showInterstitialAd() {
    if (!adsAPIInitialized) {
        console.log("API Not Initialized");
        return;
    }
    googletag.cmd.push(function() {
        googletag.display('interstitial-ad');
        console.log("working");
    });
}

function setUpIMA() {
    // Create the ad display container.
    createAdDisplayContainer();

    // Create ads loader.
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    // Listen and respond to ads loaded and error events.
    adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded, false);
    adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

    // An event listener to tell the SDK that our content video
    // is completed so the SDK can play any post-roll ads.
    var contentEndedListener = function() {
        adsLoader.contentComplete();
    };

    videoContent.onended = contentEndedListener;

    // Request video ads
    var adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = adsResponseData.revive.v_ads.url;

    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 400;

    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    adsLoader.requestAds(adsRequest);
}

function createAdDisplayContainer() {
    // We assume the adContainer is the DOM id of the element that will house
    // the ads.
    adDisplayContainer = new google.ima.AdDisplayContainer(
        document.getElementById('adContainer'), videoContent);
}

function playAds() {
    // Initialize the container. Must be done via a user action on mobile devices.
    videoContent.load();
    adDisplayContainer.initialize();

    try {
        // Initialize the ads manager. Ad rules playlist will start at this time.
        adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
        // Call play to start showing the ad. Single video and overlay ads will
        // start at this time; the call will be ignored for ad rules.
        adsManager.start();
    } catch (adError) {
        // An error may be thrown if there was a problem with the VAST response.
        videoContent.play();
    }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
    // Get the ads manager.
    var adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    // videoContent should be set to the content video element.
    adsManager =
        adsManagerLoadedEvent.getAdsManager(videoContent, adsRenderingSettings);

    // Add listeners to the required events.
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        onContentResumeRequested);
    adsManager.addEventListener(
        google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);

}

function onAdEvent(adEvent) {
    // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
    // don't have ad object associated.
    var ad = adEvent.getAd();
    switch (adEvent.type) {
        case google.ima.AdEvent.Type.LOADED:
            // This is the first event sent for an ad - it is possible to
            // determine whether the ad is a video ad or an overlay.
            if (!ad.isLinear()) {
                // Position AdDisplayContainer correctly for overlay.
                // Use ad.width and ad.height.
                videoContent.play();
            }
            break;
        case google.ima.AdEvent.Type.STARTED:
            // This event indicates the ad has started - the video player
            // can adjust the UI, for example display a pause button and
            // remaining time.
            if (ad.isLinear()) {
                // For a linear ad, a timer can be started to poll for
                // the remaining time.
                intervalTimer = setInterval(
                    function() {
                        var remainingTime = adsManager.getRemainingTime();
                    },
                    300); // every 300ms
            }
            break;
        case google.ima.AdEvent.Type.COMPLETE:
            // This event indicates the ad has finished - the video player
            // can perform appropriate UI actions, such as removing the timer for
            // remaining time detection.
            if (ad.isLinear()) {
                clearInterval(intervalTimer);
            }
            break;
    }
}

function onAdError(adErrorEvent) {
    // Handle the error logging.
    console.log(adErrorEvent.getError());
    videoContent.play();
}

function onContentPauseRequested() {
    videoContent.pause();
    // This function is where you should setup UI for showing ads (e.g.
    // display ad timer countdown, disable seeking etc.)
    // setupUIForAds();
}

function onContentResumeRequested() {
    videoContent.play();
    // This function is where you should ensure that your UI is ready
    // to play content. It is the responsibility of the Publisher to
    // implement this function when necessary.
    // setupUIForContent();
}

// XHR request to get Ad responce
function initializedAdAPIRequest() {
    if (adsAPIInitialized) {
        console.log("API Already Initialized");
        return;
    }
    console.log("Initialized Ad API");

    let xhr = new XMLHttpRequest();

    xhr.addEventListener('readystatechange', function() {
        if (this.readyState === this.DONE) {
            if (this.status === 200) {
                adsAPIresponse = JSON.parse(this.responseText)
                adsResponseData = adsAPIresponse;
                console.log(this.responseText)
            }
            adsAPIInitialized = true;
            // Setup IMA
            setUpIMA();

            // Setup GPT
            setUpGPT();
        }
    });

    xhr.open(RESPONSE_TYPE.GET, adsAPIEndpoint + gameid);
    xhr.setRequestHeader('content-type', contentType);

    xhr.send();
};

// XHR request to POST score
function postScoreAPIRequest(_user_id, _game_id, _score) {
    if (!adsAPIInitialized) {
        console.log("API Not Initialized");
        return;
    }

    let postData = "user_id=" + _user_id + "&game_id=" + _game_id + "&action_id=SCORE" + "&score=" + _score;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener('readystatechange', function() {
        if (this.readyState === this.DONE) {
            if (this.status === 200) {
                console.log("Post Score");
                console.log(this.responseText);
                console.log(adsAPIresponse)
                window.alert(JSON.parse(this.responseText).resp_msg);
            }
        }
    });

    xhr.open(RESPONSE_TYPE.POST, scoreAPIEndpoint);
    xhr.setRequestHeader('content-type', contentType);

    xhr.send(postData);
};

function submitScore() {
    postScoreAPIRequest(userid, gameid, score);
};

//  Check for reward ads waterfall flow
function checkAndShowAds() {
    if (!adsAPIInitialized) {
        console.log("API Not Initialized");
        return;
    }
   // adsResponseData.revive.i_ads.s = 1;
    //console.log( "S: ",adsResponseData.revive.i_ads.s);

    console.log("Show Ads")
    if (adsResponseData.revive.v_ads.s == 1) {
        console.log("Show Video Ads");
         console.log(adsResponseData.revive.v_ads.url);
         console.log(adsResponseData.revive.v_ads.s);
         playAds();
         
       
    }else if (adsResponseData.revive.i_ads.s == 1) {
        console.log("Show Interstitial Ads");
        console.log(adsResponseData.revive.i_ads.url);
        console.log(adsResponseData.revive.i_ads.s);
        console.log(adsResponseData.revive.i_ads.ad_size);
        showInterstitialAd();
        
       
    } else {
        console.log("No ads avialable to Show");
    }
};

initAPI();