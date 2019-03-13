# MMM-Snowboy
A custom hotword / wakeword detection module for MagicMirror2

### Installation

1. Install pre-dependencies
```sh
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install libmagic-dev libatlas-base-dev
sudo apt-get install sox libsox-fmt-all
```
1. Install Module
```sh
git clone https://github.com/Zuyderwijk/MMM-Snowboy.git
cd MMM-Snowboy
npm i
```

You'll probably run into an error in `kiosk` mode which says:
```
Error: Cannot find module '/home/pi/MagicMirror/modules/MMM-Snowboy/node_modules/snowboy/lib/node/binding/Release/electron-v2.0-linux-arm/snowboy.node'
```
You need to rebuild the binaries from Snowboy to match those from the Electron version you are running:
```sh
cd ~/MagicMirror/modules/MMM-Snowboy/node_modules/snowboy
npm install --save-dev electron-rebuild
npm install nan
./node_modules/.bin/electron-rebuild
```

Once the binaries rebuild is finished, you should be good to go! :)



### Configuration

If you'd go for the default config, you can simply include the module in your config like this:

```
{
  module: "MMM-Snowboy",
  config: {}
},
```


