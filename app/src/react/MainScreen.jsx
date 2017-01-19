import React from 'react';
import StatusView from './StatusView';
import DiskView from './DiskView';

const Version = ({versionStr}) => <div id="version"><p>{versionStr}</p></div>;
const manifest = chrome.runtime.getManifest();

export default ({app, restart}) => <div>
  <StatusView app={app}/>
  <DiskView sculpture={app.sculpture} config={app.config} dispatcher={app.dispatcher}/>
  <Version versionStr={`V${manifest.version}`}/>
  <button onClick={restart}>Restart</button>
</div>;
