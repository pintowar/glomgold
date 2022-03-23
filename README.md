# Glomgold

| Service       | Master                                                                                                                                                                | Develop                                                                                                                                                                                             |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| CI Status     | ![master status](https://github.com/pintowar/glomgold/actions/workflows/gradle_master.yml/badge.svg?branch=master)                                                    | ![develop status](https://github.com/pintowar/glomgold/actions/workflows/gradle_develop.yml/badge.svg?branch=develop)                                                                               |
| Test Coverage | [![Sonar Coverage](https://sonarcloud.io/api/project_badges/measure?project=pintowar_glomgold&metric=coverage)](https://sonarcloud.io/dashboard?id=pintowar_glomgold) | [![Sonar Coverage](https://sonarcloud.io/api/project_badges/measure?project=pintowar_glomgold&metric=coverage&branch=develop)](https://sonarcloud.io/dashboard?id=pintowar_glomgold&branch=develop) |

![GitHub release (latest)](https://img.shields.io/github/v/release/pintowar/glomgold?logo=github)
![Docker release (latest)](https://img.shields.io/docker/v/pintowar/glomgold?sort=semver&logo=docker)
![GitHub license](https://img.shields.io/github/license/pintowar/glomgold)

Simple Micronaut + React application to manage personal finance.

## Project Info

This project is a small, but functional project to help manage/track personal finance expenses.. 

This is a multi user application, so every user needs credentials to access it and have access to their personal info. User can have only 2 different roles:

* **admin** (ROLE_ADMIN): can access the admin panel and manage general data;
* **user** (ROLE_USER): only have access to their control and report panel.

This is a non-blocking IO Micronaut (with Kotlin + Coroutines + r2dbc) application on **server side** and a React (with Refine + antd) application on the **client side**.

The application also only supports **postgres** as database.

This project also make use of GraalVM to build a final native application.

### Project Modules

The project was broken into the following modules:

* glomgold-webclient: Web client UI using React js + Typescript + Refine + Antd;
* glomgold-webserver: Webserver using Micronaut framework + Kotlin.

## Building Project

To build the fat jar client version of the app, run the following command:

gradle -Pprod clean assembleWebApp

The `-Pprod` param tells gradle to add the minified client generated on sudoscan-glomgold sub-module into the main jar. This command will generate a jar file in the `build` folder.

## Running Project

To run the generated JAR, it's necessary to inform some additional ENVs, they are:

| ENV                            | Description          | Default value                    |
|--------------------------------|----------------------|----------------------------------|
| DB_HOST                        | Database host        | localhost                        |
| DB_PORT                        | Databas port         | 5432                             |
| DB_NAME                        | Database name        | glomgold                         |
| DB_USERNAME                    | Database username    | postgres                         |
| DB_PASSWORD                    | Database password    | postgres                         |
| JWT_GENERATOR_SIGNATURE_SECRET | JWT Generator Secret | pleaseChangeThisSecretForANewOne |
| MICRONAUT_ENVIRONMENTS         | Default environments |                                  |

The following command will run the generated jar in development mode (env):

`MICRONAUT_ENVIRONMENTS=dev java -jar glomgold.jar`

It's not necessary to inform all ENVs for development (only MICRONAUT_ENVIRONMENTS ie necessary), all others will use their default value.

For production all ENVs need to be informed (and MICRONAUT_ENVIRONMENTS must be set to `prod`).

### Running with Docker-Compose

For a quick view of the application in action, you can download the `docker-compose.yml` file and run `docker-compose up`. 

The compose file will download a **postgres** and **glomgold** image and run it in production ENV. It will also populate the database with an initial sample.

After the application is running, it can be accessed using the browser at `http://localhost:8080`.

### Initial Sample

The initial sample will create 3 users (1 ROLE_ADMIN and 2 ROLE_USERS) with some random data.

The initial users (and their passwords) are:

1. admin / admin
2. scrooge / 123123
3. donald / 123123