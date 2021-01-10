# Flow by LabGrid

Flow by LabGrid is an open-source configurable workflow manager with a React/Typescript frontend, Python Flask backend, and Postgres database.  

This project is currently under active development. See the getting started documentation to run the app using Docker and Auth0 for user auth. Hosted version of the latest master branch is available at https://flow.labgrid.com

If you have a question for us, feel to reach out at: [![Gitter chat](https://badges.gitter.im/lab-grid/community.png)](https://gitter.im/lab-grid/community)

## Philosophy

We want to make a self-hosted workflow manager for companies and biotech labs that have privacy and security concerns about their data going to third party services. We are striving for an easy-to-deploy solution that can be used in regulated lab environments. Flow by LabGrid gives you full control over your lab's workflows and data. 

## Features
- **Custom workflow manager** - a customizable workflow manager you can deploy in your own environment 
- **Drag and drop protocol widgets** - easy to make new workflow widgets
- **Audit trails and reporting** - reports available for all events
- **React Native support** - (work in progress)
- **For your whole team** - share protocols with teammates, view runs across the team
- **Built with Postgres, React, Flask** - optimized for responsiveness, fault-tolerance, and support for regulated environments. Backend based on Python means easy integration of scientific libraries.

# Getting Started

Flow by LabGrid is currently under active development. Development docker containers that support hot code reloading on edit are provided.


## First, prepare authentication settings

At the moment, only Auth0 is supported; you will need an Auth0 account.

1. Setup a react application for your auth0 tenant.  
1. And an API.  
1. Add the following permission scopes to the API: 
`write:protocols`, `read:protocols`, `write:runs`, `read:runs`  
1. Add a redirect url and allowed origin to the auth0 application: `http://localhost:3000`.

### You will need the following for the .env file in the next step:  
* **Domain**: The tenant name with regional subdomain. For example, the name `dev-123` for region `us` would be `dev-123.us.auth0.com`  
* **Client ID**: an alphanumeric string, which is the unique identifier for your application. For example, q8fij2iug0CmgPLfTfG1tZGdTQyGaTUA  
* **Audience**: This is the URL of the authentication page. For example, `http://localhost:3000/login`  


## Then, setup your environment.
```
cp example.env .env
```

Edit the .env file to contain secrets appropriate for your environment.


To change which configuration files your docker-compose will read from, use this alias before any of the docker-compose commands below:

```sh
#sh
# Setup docker-compose to use the develop environment configuration.
alias docker-compose="docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml"
```

```powershell
#powershell
# Edit docker-compose.ps1 first to contain the configurations you would like to use
Set-Alias -Name docker-compose -Value .\docker-compose.ps1
```

## Next, launch database, server, and webapp.

```sh
docker-compose build
docker-compose up
```

Once the database, server, and webapp are running, the database itself needs to have its schema setup/updated.

## Finally, update the database

To update your database to the latest version, first start the database and server containers, run the relevant docker-compose alias command (above), then run:
```sh
#sh
./server.sh db upgrade
```

```powershell
#powershell
./server.ps1 db upgrade
```

Whenever changes to the database schema for Flow are made, new migration(s) get created in the server/migrations/versions/ directory. 

-----------------

## [Additional documentation on wiki](https://github.com/lab-grid/flow/wiki/Getting-Started)


## Troubleshooting

To see which of the containers (server, db, web) are running or failed, run:
```sh
docker-compoase ps
```

To stand up each container in separate terminals, for clearer error messages from each part, pass the name of the container (db, server, or web) to docker-compose up. For example:
```sh
docker-compoase up db
```

If you need to get rid of your local database, for example because you have forgotten the password for it: remove the .postgres directory. This is created in the top-level repo directory for local development when you use the example.env database env variables.


