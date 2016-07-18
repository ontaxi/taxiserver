CREATE TABLE IF NOT EXISTS `taxi_accounts` (
  `acc_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned DEFAULT NULL,
  `time_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(10) CHARACTER SET utf8 NOT NULL,
  `login` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `password_hash` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `token` varchar(100) CHARACTER SET utf8 DEFAULT NULL,
  `token_expires` timestamp NULL DEFAULT NULL,
  `deleted` tinyint(4) NOT NULL DEFAULT '0',
  `call_id` varchar(20) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `name` varchar(100) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `work_phone` varchar(20) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `personal_phone` varchar(20) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `birth_date` date DEFAULT NULL,
  `photo` varchar(200) CHARACTER SET utf8 DEFAULT NULL,
  `prefs` text CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`acc_id`),
  UNIQUE KEY `type` (`type`,`login`),
  KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


CREATE TABLE IF NOT EXISTS `taxi_a_streets` (
  `street_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `town_id` int(10) unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`street_id`),
  KEY `FK_taxi_a_streets_taxi_a_towns` (`town_id`),
  KEY `name` (`name`),
  CONSTRAINT `FK_taxi_a_streets_taxi_a_towns` FOREIGN KEY (`town_id`) REFERENCES `taxi_a_towns` (`town_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

CREATE TABLE IF NOT EXISTS `taxi_a_towns` (
  `town_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`town_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_calls` (
  `call_id` varchar(50) NOT NULL,
  `disp_id` int(10) unsigned NOT NULL,
  `dir` varchar(3) NOT NULL DEFAULT 'in',
  `phone` varchar(50) NOT NULL,
  `creation_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `begin_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `call_id` (`call_id`),
  KEY `FK_taxi_calls_taxi_accounts` (`disp_id`),
  CONSTRAINT `FK_taxi_calls_taxi_accounts` FOREIGN KEY (`disp_id`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_cars` (
  `car_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned DEFAULT NULL,
  `group_id` int(10) unsigned NOT NULL,
  `name` varchar(30) DEFAULT NULL COMMENT 'e.g. Renault Scenic',
  `body_type` enum('sedan','hatchback','estate','minivan','bus') DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `plate` varchar(20) DEFAULT NULL COMMENT 'license plate',
  `photo` varchar(200) DEFAULT NULL COMMENT 'photo file path',
  `deleted` tinyint(4) NOT NULL DEFAULT '0',
  `year_made` year(4) DEFAULT NULL,
  `class` varchar(20) NOT NULL DEFAULT '',
  `warrant_date` date DEFAULT NULL,
  `warrant_expires` date DEFAULT NULL,
  `insurance_num` varchar(20) DEFAULT NULL,
  `insurance_expires` date DEFAULT NULL,
  `certificate_num` varchar(20) DEFAULT NULL,
  `certificate_expires` date DEFAULT NULL,
  `odometer` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`car_id`),
  KEY `group_id` (`group_id`),
  KEY `FK_taxi_cars_taxi_services` (`service_id`),
  KEY `class` (`class`),
  CONSTRAINT `FK_taxi_cars_taxi_services` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`),
  CONSTRAINT `taxi_cars_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `taxi_car_groups` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;


CREATE TABLE IF NOT EXISTS `taxi_car_groups` (
  `group_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`group_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `taxi_car_groups_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_car_group_fares` (
  `group_id` int(10) unsigned NOT NULL,
  `fare_id` int(10) unsigned NOT NULL,
  KEY `group_id` (`group_id`),
  KEY `fare_id` (`fare_id`),
  CONSTRAINT `taxi_car_group_fares_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `taxi_car_groups` (`group_id`),
  CONSTRAINT `taxi_car_group_fares_ibfk_2` FOREIGN KEY (`fare_id`) REFERENCES `taxi_fares` (`fare_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_channels` (
  `message_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `t` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `channel_id` int(10) unsigned DEFAULT NULL,
  `acc_id` int(10) unsigned DEFAULT NULL,
  `loc_id` int(10) unsigned DEFAULT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `channel_id` (`channel_id`),
  KEY `t` (`t`),
  KEY `loc_id` (`loc_id`),
  KEY `FK_taxi_channels_taxi_accounts` (`acc_id`),
  CONSTRAINT `FK_taxi_channels_taxi_accounts` FOREIGN KEY (`acc_id`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_chat` (
  `msg_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `t` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `from` int(10) unsigned NOT NULL,
  `to` int(10) unsigned DEFAULT NULL,
  `to_type` varchar(20) DEFAULT NULL,
  `text` text NOT NULL,
  PRIMARY KEY (`msg_id`),
  KEY `to_type` (`to_type`),
  KEY `t` (`t`),
  KEY `FK__taxi_accounts` (`from`),
  KEY `FK__taxi_accounts_2` (`to`),
  KEY `t_from_to_to_type` (`from`,`to`,`to_type`),
  CONSTRAINT `FK__taxi_accounts` FOREIGN KEY (`from`) REFERENCES `taxi_accounts` (`acc_id`),
  CONSTRAINT `FK__taxi_accounts_2` FOREIGN KEY (`to`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_customers` (
  `customer_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `blacklist` enum('1','0') NOT NULL DEFAULT '0',
  `comments` text NOT NULL,
  `firm` varchar(200) DEFAULT NULL,
  `is_valid` tinyint(4) NOT NULL DEFAULT '0',
  `phone1` varchar(20) DEFAULT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  `passport` varchar(20) DEFAULT NULL,
  `tin_num` varchar(20) DEFAULT NULL,
  `bank_account` varchar(20) DEFAULT NULL,
  `dl_num` varchar(20) DEFAULT NULL,
  `dl_expires` date DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address1` varchar(200) DEFAULT NULL,
  `address2` varchar(200) DEFAULT NULL,
  `discount` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`customer_id`),
  KEY `service_id` (`service_id`),
  KEY `phone` (`phone`),
  CONSTRAINT `service_id` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_dispatchers` (
  `acc_id` int(10) unsigned NOT NULL,
  `loc_id` int(10) unsigned DEFAULT NULL,
  KEY `acc_id` (`acc_id`),
  KEY `loc_id` (`loc_id`),
  CONSTRAINT `taxi_dispatchers_ibfk_1` FOREIGN KEY (`acc_id`) REFERENCES `taxi_accounts` (`acc_id`) ON DELETE CASCADE,
  CONSTRAINT `taxi_dispatchers_ibfk_2` FOREIGN KEY (`loc_id`) REFERENCES `taxi_locations` (`loc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_drivers` (
  `driver_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `acc_id` int(10) unsigned DEFAULT NULL,
  `car_id` int(10) unsigned DEFAULT NULL,
  `group_id` int(10) unsigned DEFAULT NULL,
  `type_id` int(10) unsigned DEFAULT NULL,
  `client_version` varchar(200) NOT NULL DEFAULT '0',
  `last_ping_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_order_time` timestamp NULL DEFAULT NULL,
  `alarm_time` timestamp NULL DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `accept_new_orders` smallint(5) unsigned NOT NULL DEFAULT '1',
  `firm` varchar(50) DEFAULT NULL,
  `is_fake` smallint(6) NOT NULL DEFAULT '0',
  `is_brig` smallint(6) NOT NULL DEFAULT '0',
  `is_online` smallint(6) NOT NULL DEFAULT '0',
  `deleted` smallint(6) NOT NULL DEFAULT '0',
  `block_until` timestamp NOT NULL DEFAULT '2000-01-01 00:00:00',
  `block_reason` varchar(50) NOT NULL DEFAULT '',
  `order_refuses` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `has_bank_terminal` tinyint(4) NOT NULL DEFAULT '0',
  `dl_num` varchar(20) DEFAULT NULL,
  `dl_expires` date DEFAULT NULL,
  `health_cert` varchar(20) DEFAULT NULL,
  `health_cert_expires` date DEFAULT NULL,
  `taxi_cert` varchar(20) DEFAULT NULL,
  `taxi_cert_expires` date DEFAULT NULL,
  PRIMARY KEY (`driver_id`),
  KEY `FK_taxi_drivers_taxi_cars` (`car_id`),
  KEY `group_id` (`group_id`),
  KEY `acc_id` (`acc_id`),
  KEY `FK_taxi_drivers_taxi_driver_types` (`type_id`),
  CONSTRAINT `FK_taxi_drivers_taxi_cars` FOREIGN KEY (`car_id`) REFERENCES `taxi_cars` (`car_id`),
  CONSTRAINT `FK_taxi_drivers_taxi_driver_types` FOREIGN KEY (`type_id`) REFERENCES `taxi_driver_types` (`type_id`) ON DELETE SET NULL,
  CONSTRAINT `taxi_drivers_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `taxi_driver_groups` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;


CREATE TABLE IF NOT EXISTS `taxi_driver_groups` (
  `group_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`group_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `taxi_driver_groups_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_driver_group_queues` (
  `group_id` int(10) unsigned NOT NULL,
  `queue_id` int(10) unsigned NOT NULL,
  KEY `taxi_driver_group_queues_ibfk_1` (`group_id`),
  KEY `taxi_driver_group_queues_ibfk_2` (`queue_id`),
  CONSTRAINT `taxi_driver_group_queues_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `taxi_driver_groups` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `taxi_driver_group_queues_ibfk_2` FOREIGN KEY (`queue_id`) REFERENCES `taxi_queues` (`queue_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_driver_types` (
  `type_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`type_id`),
  KEY `FK__taxi_services` (`service_id`),
  CONSTRAINT `FK__taxi_services` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_events` (
  `t` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acc_id` int(10) unsigned DEFAULT NULL,
  `event` varchar(100) NOT NULL,
  KEY `t` (`t`),
  KEY `acc_id` (`acc_id`),
  CONSTRAINT `taxi_events_ibfk_1` FOREIGN KEY (`acc_id`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_fares` (
  `fare_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `name` varchar(20) NOT NULL,
  `start_price` int(10) unsigned NOT NULL DEFAULT '0',
  `minimal_price` int(10) unsigned NOT NULL DEFAULT '0',
  `kilometer_price` int(10) unsigned NOT NULL DEFAULT '0',
  `slow_hour_price` int(10) unsigned NOT NULL DEFAULT '0',
  `deleted` tinyint(4) NOT NULL DEFAULT '0',
  `location_type` enum('city','town') NOT NULL,
  `hour_price` int(10) unsigned DEFAULT NULL,
  `day_price` int(10) unsigned DEFAULT NULL,
  `special_price` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`fare_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `taxi_fares_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_locations` (
  `loc_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `name` varchar(200) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_name` varchar(100) DEFAULT NULL,
  `comments` varchar(500) NOT NULL DEFAULT '',
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `do_reports` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`loc_id`),
  KEY `name` (`name`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `taxi_locations_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_location_dispatches` (
  `loc_id` int(10) unsigned NOT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int(10) unsigned DEFAULT NULL,
  `mode` varchar(20) NOT NULL DEFAULT 'sequential',
  `order` tinyint(4) NOT NULL DEFAULT '0',
  `importance` tinyint(4) NOT NULL DEFAULT '0',
  KEY `FK__taxi_locations` (`loc_id`),
  CONSTRAINT `FK__taxi_locations` FOREIGN KEY (`loc_id`) REFERENCES `taxi_locations` (`loc_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_logs` (
  `message_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `t` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `text` text NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `service_id` (`service_id`),
  KEY `t` (`t`),
  CONSTRAINT `taxi_logs_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_log_logins` (
  `num` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `acc_id` int(10) unsigned NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_time` timestamp NULL DEFAULT NULL,
  `login_addr` varchar(100) DEFAULT NULL,
  `logout_addr` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`num`),
  KEY `acc_id` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_log_positions` (
  `driver_id` int(10) unsigned NOT NULL,
  `t` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  KEY `driver_id` (`driver_id`),
  KEY `t` (`t`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_orders` (
  `order_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_uid` varchar(40) NOT NULL,
  `owner_id` int(10) unsigned DEFAULT NULL,
  `taxi_id` int(10) unsigned DEFAULT NULL,
  `car_id` int(10) unsigned DEFAULT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `service_id` int(10) unsigned DEFAULT NULL,
  `src_loc_id` int(10) unsigned DEFAULT NULL,
  `dest_loc_id` int(10) unsigned DEFAULT NULL,
  `type` varchar(10) NOT NULL DEFAULT '',
  `call_id` varchar(50) DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `opt_vip` tinyint(4) NOT NULL DEFAULT '0',
  `opt_terminal` tinyint(4) NOT NULL DEFAULT '0',
  `opt_car_class` varchar(10) DEFAULT NULL,
  `src_addr` varchar(200) NOT NULL DEFAULT '',
  `dest_addr` varchar(200) NOT NULL DEFAULT '',
  `comments` text,
  `price` int(10) unsigned NOT NULL DEFAULT '0',
  `time_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `time_assigned` timestamp NULL DEFAULT NULL,
  `time_arrived` timestamp NULL DEFAULT NULL,
  `time_started` timestamp NULL DEFAULT NULL,
  `time_finished` timestamp NULL DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `published` tinyint(4) NOT NULL DEFAULT '0',
  `cancel_reason` text,
  `exp_assignment_time` timestamp NULL DEFAULT NULL,
  `reminder_time` timestamp NULL DEFAULT NULL,
  `exp_arrival_time` timestamp NULL DEFAULT NULL,
  `est_arrival_time` timestamp NULL DEFAULT NULL,
  `arrival_distance` int(11) DEFAULT NULL,
  `deleted` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_uid` (`order_uid`),
  KEY `status` (`status`),
  KEY `time_created` (`time_created`),
  KEY `customer_id` (`customer_id`),
  KEY `car_id` (`car_id`),
  KEY `FK_taxi_orders_taxi_services` (`service_id`),
  KEY `published` (`published`),
  KEY `src_loc_id` (`src_loc_id`),
  KEY `dest_loc_id` (`dest_loc_id`),
  KEY `FK_taxi_orders_taxi_accounts` (`owner_id`),
  KEY `taxi_id` (`taxi_id`),
  KEY `FK_taxi_orders_taxi_calls` (`call_id`),
  CONSTRAINT `FK_taxi_orders_taxi_accounts` FOREIGN KEY (`owner_id`) REFERENCES `taxi_accounts` (`acc_id`),
  CONSTRAINT `FK_taxi_orders_taxi_calls` FOREIGN KEY (`call_id`) REFERENCES `taxi_calls` (`call_id`),
  CONSTRAINT `FK_taxi_orders_taxi_services` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`),
  CONSTRAINT `customer_id` FOREIGN KEY (`customer_id`) REFERENCES `taxi_customers` (`customer_id`),
  CONSTRAINT `taxi_orders_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `taxi_cars` (`car_id`),
  CONSTRAINT `taxi_orders_ibfk_2` FOREIGN KEY (`src_loc_id`) REFERENCES `taxi_locations` (`loc_id`),
  CONSTRAINT `taxi_orders_ibfk_3` FOREIGN KEY (`dest_loc_id`) REFERENCES `taxi_locations` (`loc_id`),
  CONSTRAINT `taxi_orders_ibfk_4` FOREIGN KEY (`taxi_id`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_order_stats` (
  `order_id` int(10) unsigned NOT NULL,
  `fare_id` int(10) unsigned NOT NULL,
  `distance` int(10) unsigned NOT NULL,
  `slow_time` int(10) unsigned NOT NULL,
  `total_time` int(10) unsigned NOT NULL,
  `total_distance` int(10) unsigned NOT NULL DEFAULT '0',
  KEY `fare_id` (`fare_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `taxi_order_stats_ibfk_1` FOREIGN KEY (`fare_id`) REFERENCES `taxi_fares` (`fare_id`),
  CONSTRAINT `taxi_order_stats_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `taxi_orders` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_queues` (
  `queue_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `service_id` int(10) unsigned NOT NULL,
  `loc_id` int(10) unsigned DEFAULT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT '0',
  `priority` int(10) unsigned NOT NULL DEFAULT '0',
  `min` int(10) unsigned NOT NULL DEFAULT '0',
  `upstream` tinyint(4) NOT NULL DEFAULT '0',
  `name` varchar(100) NOT NULL DEFAULT '',
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `addr` varchar(100) DEFAULT NULL,
  `radius` int(10) unsigned NOT NULL DEFAULT '0',
  `mode` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`queue_id`),
  KEY `service_id` (`service_id`),
  KEY `FK_taxi_queues_taxi_queues` (`parent_id`),
  KEY `FK_taxi_queues_taxi_locations` (`loc_id`),
  CONSTRAINT `FK_taxi_queues_taxi_locations` FOREIGN KEY (`loc_id`) REFERENCES `taxi_locations` (`loc_id`),
  CONSTRAINT `FK_taxi_queues_taxi_queues` FOREIGN KEY (`parent_id`) REFERENCES `taxi_queues` (`queue_id`),
  CONSTRAINT `taxi_queues_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_queue_addresses` (
  `range_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `queue_id` int(10) unsigned NOT NULL,
  `city` varchar(100) NOT NULL,
  `street` varchar(100) NOT NULL,
  `min_house` int(10) unsigned NOT NULL,
  `max_house` int(10) unsigned NOT NULL,
  `parity` varchar(5) NOT NULL DEFAULT 'none',
  PRIMARY KEY (`range_id`),
  KEY `FK__taxi_queues` (`queue_id`),
  CONSTRAINT `FK__taxi_queues` FOREIGN KEY (`queue_id`) REFERENCES `taxi_queues` (`queue_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_queue_drivers` (
  `queue_id` int(10) unsigned NOT NULL,
  `driver_id` int(10) unsigned NOT NULL,
  `pos` int(10) unsigned NOT NULL,
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `taxi_queue_drivers_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_services` (
  `service_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `deleted` smallint(6) NOT NULL DEFAULT '0',
  `inner_name` varchar(10) DEFAULT NULL,
  `gps_tracking` tinyint(4) NOT NULL DEFAULT '0',
  `service_logs` tinyint(4) NOT NULL DEFAULT '0',
  `sessions` tinyint(4) NOT NULL DEFAULT '0',
  `imitations` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_service_areas` (
  `area_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(10) unsigned NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `inner_name` varchar(20) NOT NULL DEFAULT '',
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `min_lat` double NOT NULL,
  `max_lat` double NOT NULL,
  `min_lon` double NOT NULL,
  `max_lon` double NOT NULL,
  PRIMARY KEY (`area_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `taxi_service_areas_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_service_settings` (
  `service_id` int(10) unsigned NOT NULL,
  `name` varchar(20) NOT NULL,
  `value` varchar(500) NOT NULL,
  UNIQUE KEY `service_id_name` (`service_id`,`name`),
  CONSTRAINT `FK_service_settings_taxi_services` FOREIGN KEY (`service_id`) REFERENCES `taxi_services` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_works` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driver_id` int(10) unsigned NOT NULL,
  `car_id` int(11) NOT NULL,
  `time_started` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `time_finished` timestamp NULL DEFAULT NULL,
  `odometer_begin` int(10) unsigned NOT NULL,
  `odometer_end` int(10) unsigned DEFAULT NULL,
  `begin_dispatcher` int(10) unsigned DEFAULT NULL,
  `end_dispatcher` int(10) unsigned DEFAULT NULL,
  `begin_latitude` double DEFAULT NULL,
  `begin_longitude` double DEFAULT NULL,
  `begin_address` varchar(100) DEFAULT NULL,
  `end_latitude` double DEFAULT NULL,
  `end_longitude` double DEFAULT NULL,
  `end_address` varchar(100) DEFAULT NULL,
  `gps_distance` float NOT NULL DEFAULT '0',
  `last_activity_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `_driver_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `begin_dispatcher` (`begin_dispatcher`),
  KEY `end_dispatcher` (`end_dispatcher`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `taxi_works_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `taxi_accounts` (`acc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `taxi_work_orders` (
  `work_id` int(11) NOT NULL,
  `order_id` int(10) unsigned NOT NULL,
  UNIQUE KEY `work_id` (`work_id`,`order_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `taxi_work_orders_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `taxi_works` (`id`),
  CONSTRAINT `taxi_work_orders_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `taxi_orders` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
