# taxiserver
A system to dispatch orders to taxi drivers


## Overview

This is the server-side part of a system consisting of:

* the taxi server,
* the web-based control panels,
* and the taxi driver application.

The server accepts network connections from applications used by taxi
drivers and dispatches new orders to them. The orders come from a
dispatcher's panel or a remote server. The driver and server network
protocols descriptions are in the `doc` directory.


## Requirements

The server and the panels require the PHP 5 interpreter with cURL and
MySQLi extensions enabled, and MariaDB (ex-MySQL) server.

The taxi server needs to do direct and reverse geolocation for many of
its tasks, so a Nominatim service is used for that. By default the
official nominatim service is used for demo purposes, but it is
recommended to have your own installation.

An OSRM router is also used in minor tasks like calculating road
distances or showing routes to drivers and dispatchers. By default, the
official OSRM service is used also for purposes.


## Installation

Create a new database and import the `schema.sql` file into it.

Edit the `install.php` script to match your database access and run it.
It will create a service record and an admin account for it.

Modify the `server/taxiserver.conf` and `panels/settings.ini` files:
set the correct MariaDB/MySQL access, listen port number, Nominatim
URL and OSRM URL.

Deploy the `panels` contents, without the `.src` directory, to your web
server. Then open the `service-panel` URL (for example,
http://example.net/service-panel) and use `"admin"` as login name and
password. There create all needed driver and dispatcher accounts, and
modify the service settings on the settings page.

Run the `server/build.sh` script. It will simply concatenate all the
files in the `lib` and `src` directories into a single PHP script
inside the `out/obj` directory.  Then deploy the entire `out` directory
where needed.


## Street and town names

There are tables of town and street names in the database that are used
to help dispatchers enter addresses. These are the `taxi_a_towns` and
`taxi_a_streets` tables. They are supposed to be filled with names used
by the dispatchers in your location. If that location happens to be one
of Belarus cities, you can import the SQL dump from
https://ontax.by/by-towns.sql.gz.


## Running the server

Basically what is needed is running `php obj/taxi.php` in the directory
where the `taxiserver.conf` file is, but it's up to the system
administrator to decide the most suitable way to run it. There is a
Debian-style control script `taxi`, if needed.
