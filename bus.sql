DROP TABLE IF EXISTS `bus_travel_time`;
DROP TABLE IF EXISTS `bus_stop`;
DROP TABLE IF EXISTS `bus_route`;
CREATE TABLE `bus_route` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sub_route_id` varchar(45) COLLATE utf8_bin NOT NULL,
  `route_id` varchar(45) COLLATE utf8_bin NOT NULL,
  `direction` int(1) unsigned NOT NULL,
  `route_name_cht` varchar(255) COLLATE utf8_bin NOT NULL,
  `route_name_eng` varchar(255) COLLATE utf8_bin NOT NULL,
  `city` varchar(45) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_route_id_UNIQUE` (`sub_route_id`,`direction`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `bus_stop` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `stop_id` varchar(45) COLLATE utf8_bin NOT NULL,
  `name_cht` varchar(255) COLLATE utf8_bin NOT NULL,
  `name_eng` varchar(255) COLLATE utf8_bin NOT NULL,
  `lat` decimal(10,8) NOT NULL,
  `lon` decimal(11,8) NOT NULL,
  `is_operating` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stop_id_UNIQUE` (`stop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `bus_travel_time` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sub_route_id` varchar(45) COLLATE utf8_bin NOT NULL,
  `direction` int(1) unsigned NOT NULL,
  `from_stop_id` varchar(45) COLLATE utf8_bin NOT NULL,
  `to_stop_id` varchar(45) COLLATE utf8_bin NOT NULL,
  `run_time` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bus_travel_time_ibfk_1` (`sub_route_id`,`direction`),
  KEY `bus_travel_time_ibfk_2` (`from_stop_id`),
  KEY `bus_travel_time_ibfk_3` (`to_stop_id`),
  CONSTRAINT `bus_travel_time_ibfk_1` FOREIGN KEY (`sub_route_id`,`direction`) REFERENCES `bus_route` (`sub_route_id`,`direction`),
  CONSTRAINT `bus_travel_time_ibfk_2` FOREIGN KEY (`from_stop_id`) REFERENCES `bus_stop` (`stop_id`),
  CONSTRAINT `bus_travel_time_ibfk_3` FOREIGN KEY (`to_stop_id`) REFERENCES `bus_stop` (`stop_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

SET SQL_SAFE_UPDATES = 0;
UPDATE bus_travel_time t2,
(SELECT * FROM 
(SELECT from_stop_id, to_stop_id, run_time, COUNT(*) AS count FROM bus_travel_time_log GROUP BY to_stop_id, run_time HAVING run_time > 0 ORDER BY from_stop_id, count DESC) t0 
GROUP BY from_stop_id) t1
SET t2.run_time = t1.run_time
WHERE t1.from_stop_id = t2.from_stop_id AND t1.to_stop_id = t2.to_stop_id;
SET SQL_SAFE_UPDATES = 1;
