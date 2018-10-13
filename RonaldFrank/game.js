
var Module = typeof Module !== 'undefined' ? Module : {};

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = 'game.data';
    var REMOTE_PACKAGE_BASE = 'game.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
      var fetchedCallback = null;
      var fetched = Module['getPreloadedPackage'] ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;

      if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'audio', true, true);
Module['FS_createPath']('/', 'graphics', true, true);

    function DataRequest(start, end, audio) {
      this.start = start;
      this.end = end;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);
        this.finish(byteArray);
      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['removeRunDependency']('fp ' + that.name);

        this.requests[this.name] = null;
      }
    };

        var files = metadata.files;
        for (var i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].audio).open('GET', files[i].filename);
        }

  
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // copy the entire loaded file into a spot in the heap. Files will refer to slices in that. They cannot be freed though
        // (we may be allocating before malloc is ready, during startup).
        if (Module['SPLIT_MEMORY']) err('warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting');
        var ptr = Module['getMemory'](byteArray.length);
        Module['HEAPU8'].set(byteArray, ptr);
        DataRequest.prototype.byteArray = Module['HEAPU8'].subarray(ptr, ptr+byteArray.length);
  
          var files = metadata.files;
          for (var i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_game.data');

    };
    Module['addRunDependency']('datafile_game.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

 }
 loadPackage({"files": [{"start": 0, "audio": 0, "end": 2068, "filename": "/asteroid.lua"}, {"start": 2068, "audio": 0, "end": 2863, "filename": "/bigexplosion.lua"}, {"start": 2863, "audio": 0, "end": 4315, "filename": "/bird.lua"}, {"start": 4315, "audio": 0, "end": 5256, "filename": "/bullet.lua"}, {"start": 5256, "audio": 0, "end": 5774, "filename": "/bush.lua"}, {"start": 5774, "audio": 0, "end": 7196, "filename": "/class.lua"}, {"start": 7196, "audio": 0, "end": 7864, "filename": "/cloud.lua"}, {"start": 7864, "audio": 0, "end": 8290, "filename": "/cloud2.lua"}, {"start": 8290, "audio": 0, "end": 8736, "filename": "/conf.lua"}, {"start": 8736, "audio": 0, "end": 10131, "filename": "/enemy.lua"}, {"start": 10131, "audio": 0, "end": 10735, "filename": "/explosion.lua"}, {"start": 10735, "audio": 0, "end": 11299, "filename": "/laser.lua"}, {"start": 11299, "audio": 0, "end": 19942, "filename": "/main.lua"}, {"start": 19942, "audio": 0, "end": 22780, "filename": "/menu.lua"}, {"start": 22780, "audio": 0, "end": 23772, "filename": "/powerup.lua"}, {"start": 23772, "audio": 0, "end": 29328, "filename": "/rocket.lua"}, {"start": 29328, "audio": 0, "end": 33770, "filename": "/scene1.lua"}, {"start": 33770, "audio": 0, "end": 35215, "filename": "/scene2.lua"}, {"start": 35215, "audio": 0, "end": 38963, "filename": "/scene3.lua"}, {"start": 38963, "audio": 0, "end": 43260, "filename": "/scene4.lua"}, {"start": 43260, "audio": 0, "end": 48454, "filename": "/scene5.lua"}, {"start": 48454, "audio": 0, "end": 53427, "filename": "/scene6.lua"}, {"start": 53427, "audio": 0, "end": 53931, "filename": "/splatter.lua"}, {"start": 53931, "audio": 0, "end": 54835, "filename": "/star.lua"}, {"start": 54835, "audio": 1, "end": 85341, "filename": "/audio/approach.ogg"}, {"start": 85341, "audio": 1, "end": 276919, "filename": "/audio/bigexplosion.ogg"}, {"start": 276919, "audio": 1, "end": 856254, "filename": "/audio/credits.ogg"}, {"start": 856254, "audio": 1, "end": 861470, "filename": "/audio/ding.ogg"}, {"start": 861470, "audio": 1, "end": 964144, "filename": "/audio/explosion.ogg"}, {"start": 964144, "audio": 1, "end": 970171, "filename": "/audio/gunfire.ogg"}, {"start": 970171, "audio": 1, "end": 986058, "filename": "/audio/laser.ogg"}, {"start": 986058, "audio": 1, "end": 1233887, "filename": "/audio/launch.ogg"}, {"start": 1233887, "audio": 1, "end": 1243162, "filename": "/audio/Power UP new sound.ogg"}, {"start": 1243162, "audio": 1, "end": 1255533, "filename": "/audio/space.ogg"}, {"start": 1255533, "audio": 1, "end": 1264839, "filename": "/audio/splat.ogg"}, {"start": 1264839, "audio": 1, "end": 1274700, "filename": "/audio/sunglasses.ogg"}, {"start": 1274700, "audio": 1, "end": 4568005, "filename": "/audio/trosong.ogg"}, {"start": 4568005, "audio": 0, "end": 4569573, "filename": "/graphics/alert.png"}, {"start": 4569573, "audio": 0, "end": 4569835, "filename": "/graphics/arrow.png"}, {"start": 4569835, "audio": 0, "end": 4640425, "filename": "/graphics/asteroid-big1.png"}, {"start": 4640425, "audio": 0, "end": 4711108, "filename": "/graphics/asteroid-big2.png"}, {"start": 4711108, "audio": 0, "end": 4714008, "filename": "/graphics/asteroid-small1.png"}, {"start": 4714008, "audio": 0, "end": 4716899, "filename": "/graphics/asteroid-small2.png"}, {"start": 4716899, "audio": 0, "end": 4720090, "filename": "/graphics/awesome.png"}, {"start": 4720090, "audio": 0, "end": 4783333, "filename": "/graphics/bigexplosion.png"}, {"start": 4783333, "audio": 0, "end": 4785879, "filename": "/graphics/bird.png"}, {"start": 4785879, "audio": 0, "end": 4786286, "filename": "/graphics/bullet.png"}, {"start": 4786286, "audio": 0, "end": 4787238, "filename": "/graphics/bush1.png"}, {"start": 4787238, "audio": 0, "end": 4788213, "filename": "/graphics/bush2.png"}, {"start": 4788213, "audio": 0, "end": 4788493, "filename": "/graphics/cloud1.png"}, {"start": 4788493, "audio": 0, "end": 4788745, "filename": "/graphics/cloud2.png"}, {"start": 4788745, "audio": 0, "end": 4793981, "filename": "/graphics/enemy.png"}, {"start": 4793981, "audio": 0, "end": 4815153, "filename": "/graphics/explosion.png"}, {"start": 4815153, "audio": 0, "end": 4816739, "filename": "/graphics/font.png"}, {"start": 4816739, "audio": 0, "end": 4817069, "filename": "/graphics/ground.png"}, {"start": 4817069, "audio": 0, "end": 4817868, "filename": "/graphics/groundwin.png"}, {"start": 4817868, "audio": 0, "end": 4819349, "filename": "/graphics/icon.png"}, {"start": 4819349, "audio": 0, "end": 5189681, "filename": "/graphics/kode alam semesta - Copy.jpg"}, {"start": 5189681, "audio": 0, "end": 5239056, "filename": "/graphics/kode alam semesta.jpg"}, {"start": 5239056, "audio": 0, "end": 5239496, "filename": "/graphics/littleexplosion.png"}, {"start": 5239496, "audio": 0, "end": 5242833, "filename": "/graphics/player.png"}, {"start": 5242833, "audio": 0, "end": 5245983, "filename": "/graphics/playerwin.png"}, {"start": 5245983, "audio": 0, "end": 5248848, "filename": "/graphics/powerup.png"}, {"start": 5248848, "audio": 0, "end": 5253827, "filename": "/graphics/randomshit.png"}, {"start": 5253827, "audio": 0, "end": 5254244, "filename": "/graphics/rocket.png"}, {"start": 5254244, "audio": 0, "end": 5254722, "filename": "/graphics/rocketkaputt.png"}, {"start": 5254722, "audio": 0, "end": 5258594, "filename": "/graphics/splatter.png"}, {"start": 5258594, "audio": 0, "end": 5258928, "filename": "/graphics/star.png"}, {"start": 5258928, "audio": 0, "end": 5259086, "filename": "/graphics/sunglasses.png"}, {"start": 5259086, "audio": 0, "end": 5260615, "filename": "/graphics/title.png"}, {"start": 5260615, "audio": 0, "end": 5262317, "filename": "/graphics/warning.png"}, {"start": 5262317, "audio": 0, "end": 5263008, "filename": "/graphics/wheatley.png"}, {"start": 5263008, "audio": 0, "end": 5276649, "filename": "/graphics/xron-cewe.jpg"}, {"start": 5276649, "audio": 0, "end": 5306411, "filename": "/graphics/xron-ketawa.jpg"}, {"start": 5306411, "audio": 0, "end": 5337521, "filename": "/graphics/xron-steve.jpg"}], "remote_package_size": 5337521, "package_uuid": "37f3598a-fe3a-45e2-99f5-3365d3fdcdc5"});

})();
