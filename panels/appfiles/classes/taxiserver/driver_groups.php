<?php

class driver_groups
{
	static function get_service_groups_kv( $service_id )
	{
		$a = DB::getRecords( "SELECT group_id, name FROM taxi_driver_groups
		WHERE service_id = %d", $service_id );
		return array_column( $a, 'name', 'group_id' );
	}

	/*
	 * Groups cannot belong to more than one service, but we use it
	 * here to check the ownership.
	 */
	static function delete_group( $group_id, $service_id )
	{
		$group_id = intval( $group_id );
		$service_id = intval( $service_id );
		if( !$group_id || !$service_id ) return false;

		if( !DB::exists( 'taxi_driver_groups', array(
			'group_id' => $group_id,
			'service_id' => $service_id
		))) {
			return false;
		}

		// Make sure that there are no valid drivers in the group.
		if( DB::exists( 'taxi_drivers', array(
			'group_id' => $group_id,
			'deleted' => '0'
		))) {
			return 'Нельзя удалить бригаду с водителями';
		}

		// Detach "deleted" drivers that may still be associated with
		// the group.
		DB::exec( "UPDATE taxi_drivers SET group_id = NULL
			WHERE group_id = $group_id" );

		// Remove group's relations.
		DB::exec( "DELETE FROM taxi_driver_group_queues
			WHERE group_id = $group_id" );

		// Remove the group.
		DB::exec( "DELETE FROM taxi_driver_groups
			WHERE group_id = $group_id" );
	}
}

?>
