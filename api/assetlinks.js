export default function handler(req, res) {
  // Isso garante que o Android entenda que é um arquivo de sistema
  res.setHeader('Content-Type', 'application/json');
  
  const assetLinks = [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.vercel.salonflow_pro_three.twa",
      "sha256_cert_fingerprints": ["15:17:8B:D9:B9:30:AC:14:4F:93:5E:37:58:67:2B:14:62:A6:CE:D5:A1:E5:56:AE:04:CD:48:99:BD:E4:E9:60"]
    }
  }];

  res.status(200).json(assetLinks);
}