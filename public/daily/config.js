// Criterion Daily front-end config. PUBLIC values only (this file is served by GitHub Pages).
// Never put tokens, keys from Script Properties, or any lead/deal data here.
window.CD_CONFIG = {
  // Apps Script web app /exec URL of the "Criterion Daily API" deployment.
  apiUrl: 'https://script.google.com/macros/s/AKfycbxVMPDSqG1njrfMQ9ejaRhlpRdel4YhDxBs31-BHuDWyA6dkoQ-EVzGaGBgz0hWEDc0Tw/exec',
  // Firebase console > Project settings > General > Your apps > Web app > SDK setup (config). Public by design.
  firebase: {
    apiKey: 'AIzaSyDpL1sQUPTQxZVJSigFp8Db3Bemm5Xeng4',
    authDomain: 'criterion-daily.firebaseapp.com',
    projectId: 'criterion-daily',
    messagingSenderId: '189561214947',
    appId: '1:189561214947:web:fcac3e6643c67b3a7a72d6'
  },
  // Firebase console > Project settings > Cloud Messaging > Web Push certificates > Key pair (public key).
  vapidKey: 'BNAI2Pnjpze7KL1gUHtvoKiSI8GuLdo9GVeT_tX46j42nGmqZ2KirOrA-dTy21wzya-SykhoUVHHSH7Ldyy3DiI',
  // Show "TraCy offline, deals & leads as of …" when the box hasn't synced for this many minutes.
  staleAfterMin: 10,
  // How often the open app checks for changes (seconds).
  pollSeconds: 20
};
