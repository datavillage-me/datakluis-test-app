# Datavillage Template project

This repository contains the codebase to define the object models, processes, and deployable services in the Datavillage platform

## Components

|  |  | 
| --- | --- |
| `@datavillage-me/cage-template-core`     | Core functions and object models |
| `@datavillage-me/cage-template-engine`   | The actual backend running in the datacage |
| `@datavillage-me/cage-template-frontend` | The frontend that relies on the cage-template-engine|

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
(Make sure to have the proper docker credentials in `./cage-template-engine/docker.env`)
