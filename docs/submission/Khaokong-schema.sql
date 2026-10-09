-- Khaokong: ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (ส่งด่วนมื้อเที่ยง)
-- Database schema สำหรับ MySQL 8 / MariaDB 10.5 ขึ้นไป

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` tinyint(3) unsigned NOT NULL,
  `shop_name` varchar(200) NOT NULL DEFAULT 'ข้าวกล่องเดลิเวอรี ส่งด่วนมื้อเที่ยง',
  `shop_address` varchar(500) NOT NULL DEFAULT 'มหาวิทยาลัยมหาสารคาม ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม',
  `shop_latitude` double NOT NULL DEFAULT 16.246825,
  `shop_longitude` double NOT NULL DEFAULT 103.252021,
  `box_price` decimal(10,2) NOT NULL DEFAULT 65.00,
  `box_cost` decimal(10,2) NOT NULL DEFAULT 40.00,
  `rider_base_fee` decimal(10,2) NOT NULL DEFAULT 15.00,
  `rider_fee_per_km_per_box` decimal(10,2) NOT NULL DEFAULT 2.00,
  `rider_speed_kmh` double NOT NULL DEFAULT 30,
  `max_orders_per_rider` int(11) NOT NULL DEFAULT 3,
  `max_boxes_per_order` int(11) NOT NULL DEFAULT 3,
  `departure_time` char(5) NOT NULL DEFAULT '11:30',
  `delivery_window_minutes` int(11) NOT NULL DEFAULT 60,
  `service_minutes_per_stop` double NOT NULL DEFAULT 2,
  `road_distance_factor` double NOT NULL DEFAULT 1.3,
  `service_radius_km` double NOT NULL DEFAULT 3,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL DEFAULT '',
  `phone` varchar(30) NOT NULL,
  `address` varchar(500) NOT NULL DEFAULT '',
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `note` varchar(500) NOT NULL DEFAULT '',
  `is_simulated` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_customers_name` (`first_name`,`last_name`),
  KEY `idx_customers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `riders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL DEFAULT '',
  `vehicle_plate` varchar(30) NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delivery_plans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `delivery_date` date NOT NULL,
  `objective` varchar(20) NOT NULL,
  `seed` int(10) unsigned NOT NULL,
  `revision` int(10) unsigned NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `departure_time` char(5) NOT NULL,
  `deadline_time` char(5) NOT NULL,
  `settings_snapshot` longtext NOT NULL,
  `summary` longtext NOT NULL,
  `signature` longtext NOT NULL,
  `explored_signatures` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `confirmed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_plans_date_status` (`delivery_date`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `delivery_date` date NOT NULL,
  `boxes` int(10) unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `note` varchar(500) NOT NULL DEFAULT '',
  `is_simulated` tinyint(1) NOT NULL DEFAULT 0,
  `plan_id` int(10) unsigned DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_orders_date_status` (`delivery_date`,`status`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `fk_orders_plan` (`plan_id`),
  KEY `idx_orders_simulated` (`is_simulated`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_orders_plan` FOREIGN KEY (`plan_id`) REFERENCES `delivery_plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_routes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `plan_id` int(10) unsigned NOT NULL,
  `sequence` int(10) unsigned NOT NULL,
  `job_code` varchar(20) NOT NULL,
  `color` char(7) NOT NULL,
  `rider_id` int(10) unsigned DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `order_count` int(10) unsigned NOT NULL,
  `box_count` int(10) unsigned NOT NULL,
  `distance_km` double NOT NULL,
  `duration_minutes` double NOT NULL,
  `rider_fee` decimal(10,2) NOT NULL,
  `revenue` decimal(10,2) NOT NULL,
  `food_cost` decimal(10,2) NOT NULL,
  `profit` decimal(10,2) NOT NULL,
  `path` longtext NOT NULL,
  `geometry` longtext DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_routes_job_code` (`job_code`),
  KEY `idx_routes_plan` (`plan_id`),
  KEY `fk_routes_rider` (`rider_id`),
  CONSTRAINT `fk_routes_plan` FOREIGN KEY (`plan_id`) REFERENCES `delivery_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_routes_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_stops` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `route_id` int(10) unsigned NOT NULL,
  `sequence` int(10) unsigned NOT NULL,
  `order_id` int(10) unsigned DEFAULT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `customer_name` varchar(250) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `address` varchar(500) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `boxes` int(10) unsigned NOT NULL,
  `leg_distance_km` double NOT NULL,
  `cumulative_distance_km` double NOT NULL,
  `arrival_minutes` double NOT NULL,
  `eta` char(5) NOT NULL,
  `late` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `delivered_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stops_route` (`route_id`),
  KEY `idx_stops_order` (`order_id`),
  KEY `fk_stops_customer` (`customer_id`),
  CONSTRAINT `fk_stops_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stops_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stops_route` FOREIGN KEY (`route_id`) REFERENCES `plan_routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO settings (id) VALUES (1);
