<img src="http://bit.ly/2mxmKKI" width="500" alt="Hapiness" />

<div style="margin-bottom:20px;">
<div style="line-height:60px">
    <a href="https://travis-ci.org/hapinessjs/mingo-module.svg?branch=master">
        <img src="https://travis-ci.org/hapinessjs/mingo-module.svg?branch=master" alt="build" />
    </a>
    <a href="https://coveralls.io/github/hapinessjs/mingo-module?branch=master">
        <img src="https://coveralls.io/repos/github/hapinessjs/mingo-module/badge.svg?branch=master" alt="coveralls" />
    </a>
    <a href="https://david-dm.org/hapinessjs/mingo-module">
        <img src="https://david-dm.org/hapinessjs/mingo-module.svg" alt="dependencies" />
    </a>
    <a href="https://david-dm.org/hapinessjs/mingo-module?type=dev">
        <img src="https://david-dm.org/hapinessjs/mingo-module/dev-status.svg" alt="devDependencies" />
    </a>
</div>
<div>
    <a href="https://www.typescriptlang.org/docs/tutorial.html">
        <img src="https://cdn-images-1.medium.com/max/800/1*8lKzkDJVWuVbqumysxMRYw.png"
             align="right" alt="Typescript logo" width="50" height="50" style="border:none;" />
    </a>
    <a href="http://reactivex.io/rxjs">
        <img src="http://reactivex.io/assets/Rx_Logo_S.png"
             align="right" alt="ReactiveX logo" width="50" height="50" style="border:none;" />
    </a>
    <a href="http://hapijs.com">
        <img src="http://bit.ly/2lYPYPw"
             align="right" alt="Hapijs logo" width="75" style="border:none;" />
    </a>
</div>
</div>

# mingo module

This module helps you manage files with minio as file storage and mongodb for metadata.

It uses `@hapiness/minio` module and `@hapiness/mongodb` module.

## Table of contents

* [Change History](#change-history)
* [Maintainers](#maintainers)
* [License](#license)

[Back to top](#table-of-contents)

## Usage

In your service:

```typescript
@Injectable()
class MyService {

    constructor(private _mingoService) {}

    uploadFile(...) {
        this._mingoService.fromBucket('my_bucket').createFromStream(input, filename, 'image/jpeg', metadata);
    }
}
```

## Change History
* v2.0.0 (2019-02-15)
    * Breaking Change: Add bucket name in the file document
* v1.4.0 (2019-02-14 🌹)
    * Added a new repository layer
    * Implemented a basic retry strategy for compatibility with comsodb _error 429_. (No impact on mongodb)
    * Added a new optional config option db.maxRetryAttempts: Number to determine max number of retry on cosmo retry strategy. _Default is 9._
* v1.3.0 (2019-01-30)
    * Update to @hapiness/core 1.6.x
    * Update to @hapiness/minio 2.0.1
* v1.2.0 (2018-04-25)
    * Update to @hapiness/mongo 2.x
* v1.1.2 (2018-02-14)
    * MingoModel now have an id exposed.
    * Fix when calling the toJson method but value returned by mongo is null.
* v1.1.1 (2018-02-13)
    * Fix returned object, now doesn't include mongoose metadata
* v1.1.0 (2018-01-30)
    * Update mingo model
    * Minor code updates
* v1.0.0 (2018-01-18)
    * First release

[Back to top](#table-of-contents)

## Maintainers

<table>
    <tr>
        <td colspan="5" align="center"><a href="https://www.tadaweb.com"><img src="http://bit.ly/2xHQkTi" width="117" alt="tadaweb" /></a></td>
    </tr>
    <tr>
        <td align="center"><a href="https://github.com/Juneil"><img src="https://avatars3.githubusercontent.com/u/6546204?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/antoinegomez"><img src="https://avatars3.githubusercontent.com/u/997028?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/reptilbud"><img src="https://avatars3.githubusercontent.com/u/6841511?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/njl07"><img src="https://avatars3.githubusercontent.com/u/1673977?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/xmaIIoc"><img src="https://avatars2.githubusercontent.com/u/1898461?s=117&v=4" width="117"/></a></td>
    </tr>
    <tr>
        <td align="center"><a href="https://github.com/Juneil">Julien Fauville</a></td>
        <td align="center"><a href="https://github.com/antoinegomez">Antoine Gomez</a></td>
        <td align="center"><a href="https://github.com/reptilbud">Sébastien Ritz</a></td>
        <td align="center"><a href="https://github.com/njl07">Nicolas Jessel</a></td>
        <td align="center"><a href="https://github.com/xmaIIoc">Florent Bennani</a></td>
    </tr>
</table>

[Back to top](#table-of-contents)

## License

Copyright (c) 2017 **Hapiness** Licensed under the [MIT license](https://github.com/hapinessjs/mingo-module/blob/master/LICENSE.md).

[Back to top](#table-of-contents)
