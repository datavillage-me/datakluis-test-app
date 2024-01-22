# Datavillage Template project

This repository contains the codebase to define the object models, processes, and deployable services in the Datavillage platform

## Components

|  |  | 
| --- | --- |
| `dvtemplate-core`     | Core functions and object models |
| `dvtemplate-engine`   | The actual backend running in the datacage |
| `dvtemplate-frontend` | The frontend that relies on the dvtemplate-engine|

## Build & deploy

The whole project can be built, the locally started using
```
$dvtemplate> yarn build 

$dvtemplate> yarn start 
```

The docker image can be built and published using
```
$dvtemplate> yarn deploy 
```
(Make sure to have the proper docker credentials in `./dvtemplate-engine/docker.env`)
