## Summary

The implementation of the task that can be found as `test_task.pdf`

<b>TLDR</b>:
It is a service that pools external source, writes that info into a db and provides WebSocket server for clients to gather some information. The service is written in Nodejs (tested version is `v20.17.0`)


## Installation

```bash
## alternatively just use node version v20.17.0
nvm use
npm ci
```

## Run
```bash
## for service run execute the following
npm run service

## alternatively you may execute run.sh
./run.sh 

## to execute example client run the following
npm run example_client
```

Please refer to `package.json` 'scripts' section to see supported env vars.

## Known issues , workarounds and general FAQ

- <b>Why several microservices bundled together like that?</b>

To reduce latency and meet timing requirements, the service is designed with the flexibility to be easily split into microservices, if desired.

- <b>Why ws server part stores clients?</b>

Storing clients allows the system to maintain client-specific information across different interactions. This enables features such as session restoration, where a user's previous session can be seamlessly resumed, preserving their state and progress.

- <b>Why there is several parsers involved in "emcont" part?</b>

The src directory contains several parsers because the incoming data is not in valid JSON format.

Example response from the endpoint looks like this:
```
null({"Rates":[{...},{...}]});
```

Each parser is designed to process specific formats, ensuring that we can handle a wide range of inputs. However, if the data were to become valid JSON in the future, the solution is already prepared to handle it seamlessly