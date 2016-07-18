<?php _header(); ?>

<h1>Водители</h1>

<?php
$service_id = sid();

$drivers = DB::getRecords("
	SELECT
	acc.acc_id,
	acc.login,
	acc.call_id,
	acc.work_phone AS phone,
	acc.personal_phone,
	acc.name,
	acc.photo,
	UNIX_TIMESTAMP(acc.birth_date) AS birth_date,

	d.driver_id,
	d.group_id,
	d.car_id,
	d.firm,
	d.client_version,
	d.is_fake,
	d.is_brig,
	d.has_bank_terminal,
	UNIX_TIMESTAMP(d.block_until) AS block_time,
	d.block_reason,
	d.dl_num,
	UNIX_TIMESTAMP(d.dl_expires) AS dl_expires,
	d.health_cert,
	UNIX_TIMESTAMP(d.health_cert_expires) AS health_cert_expires,
	d.taxi_cert,
	UNIX_TIMESTAMP(d.taxi_cert_expires) AS taxi_cert_expires,
	c.name AS car_name,
	c.plate AS car_plate

	FROM taxi_accounts acc
	JOIN taxi_drivers d USING (acc_id)
	LEFT JOIN taxi_cars c USING (car_id)
	LEFT JOIN taxi_car_groups g
		ON g.group_id = c.group_id
	WHERE acc.service_id = %d
	AND d.deleted = 0
	ORDER BY is_brig DESC, call_id", $service_id );

$groups = taxi_drivers::groups( $service_id );
foreach( $groups as $i => $name ) {
	$groups[$i]['table'] = new_table();
}

$now = time();
foreach( $drivers as $dr )
{
	$group_id = $dr['group_id'];
	$table = $groups[$group_id]['table'];

	$id = $dr['driver_id'];
	$ver = $dr['client_version'];
	if( $dr['is_fake'] ) {
		$ver = 'имитация';
	}

	if( $dr['block_time'] > $now ) {
		$block = 'Блокирован до ' . date( 'd.m.Y H:i', $dr['block_time'] )
			. " ($dr[block_reason])";
	}
	else {
		$block = '';
	}

	if( $dr['photo'] ) {
		$photo = HTMLSnippets::image( image_src( $dr['photo'], 50, 50 ) );
	}
	else {
		$photo = '';
	}

	$birth_date = $dr['birth_date'] ? date( 'd.m.Y', $dr['birth_date'] ) : '';
	$dlicense = $dr['dl_num'] ?
		$dr['dl_num'] . ', до ' . date( 'd.m.Y', $dr['dl_expires'] ) : '';
	$health_cert = $dr['health_cert'] ?
		$dr['health_cert'] . ', до ' . date( 'd.m.Y', $dr['health_cert_expires'] ) : '';
	$taxi_cert = $dr['taxi_cert'] ?
		$dr['taxi_cert'] . ', до '
		. date( 'd.m.Y', $dr['taxi_cert_expires'] ) : '';
	
	if( $dr['is_brig'] ) {
		$dr['login'] = "$dr[login] (бриг.)";
	}

	$row = array(
		//'id' => $dr['acc_id'],
		'login' => $dr['login'],
		'version' => $ver,
		'call_id' => $dr['call_id'],
		'block' => $block,

		'name' => $dr['name'],
		'phone' => $dr['phone'],
		'firm' => $dr['firm'],
		'has_bank_terminal' => $dr['has_bank_terminal'] ?  'да' : 'нет',

		'personal_phone' => $dr['personal_phone'],
		'photo' => $photo,
		'birth_date' => $birth_date,
		'dlicense' => $dlicense,
		'health_cert' => $health_cert,
		'taxi_cert' => $taxi_cert,

		'car_name' => $dr['car_name'],
		'plate' => $dr['car_plate'],

		'edit' => sprintf( '<a href="%s" class="edit">редактировать</a>',
			url( 'driver '.$id ) ),
		'delete' => sprintf( '<a href="%s" class="delete">удалить</a>',
			aurl( 'delete_driver '.$id ) )
	);

	$table->add_row( $row );
}

function new_table()
{
	$table = new Table(array(
		//'id' => '№',
		'login' =>  'Системное имя',
		'version' => 'Версия приложения',
		'call_id' => 'Позывной',

		'call_id' => 'Позывной',
		'block' => 'Блокировка',

		'name' => 'Имя',
		'phone' => 'Телефон',
		'firm' => 'Организация',
		'has_bank_terminal' => 'Терминал',

		'personal_phone' => 'Личный телефон',
		'photo' => 'Фотография',
		'birth_date' => 'Дата рождения',
		'dlicense' => 'Водительское удостоверение',
		'health_cert' => 'Медицинская справка',
		'taxi_cert' => 'Лицензия',

		'car_name' => 'Автомобиль',
		'plate' => 'Номерной знак'
	));
	$table->className .= ' ui-compactable';
	return $table;
}
?>

<p><a class="button" href="<?= url( 'driver' ) ?>">Добавить водителя</a>
<a class="button" href="<?= url( 'driver-types' ) ?>">Типы водителей</a>
</p>

<div class="ui-tabs">
<?php
foreach( $groups as $g )
{
	$table = $g['table'];
	$num = $table->get_rows_count();
	$url = url( 'driver-group '.$g['group_id'] );
	?>
	<section>
		<h1><?= $g['name'] ?> (<?= $num ?>)</h1>

		<a class="button edit" href="<?= $url ?>">Редактировать бригаду &laquo;<?= $g['name'] ?>&raquo;</a>
			<?php if( $num == 0 ) {
				$aurl = aurl( 'delete_driver_group '.$g['group_id'] );
				?>
				<a class="button delete" href="<?= $aurl ?>">Удалить бригаду &laquo;<?= $g['name'] ?>&raquo;</a>
				<?php
			} ?>

		<?= $table ?>
	</section>
	<?php
}
?>
	<section>
		<h1>+ новая бригада</h1>
		<?= template( '_brigade-edit', array( 'group_id' => null ) ) ?>
	</section>
</div>

<?php _footer(); ?>
