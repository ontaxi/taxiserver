<?php _header(); ?>

<?php
$customer_id = argv(1);
$customer = new customer( $customer_id, '*' );
?>

<h1><?= $customer->phone() ?></h1>

<form method="post" action="<?= aurl( 'save_service_customer' ) ?>">
	<input name="customer_id" value="<?= $customer_id ?>" type="hidden">
	<div>
		<label>Имя</label>
		<input name="name" value="<?= $customer->name() ?>">
	</div>
	<div>
		<label>Юр. лицо</label>
		<input name="firm" value="<?= $customer->firm() ?>">
	</div>
	<div>
		<?= HTMLSnippets::labelled_checkbox( 'Проверенный', 'is_valid', '1', $customer->is_valid() ) ?>
	</div>
	<div>
		<label>Телефон</label>
		<input type="tel" name="phone" value="<?= $customer->phone() ?>">
	</div>
	<div>
		<label>Телефон 1</label>
		<input type="tel" name="phone1" value="<?= $customer->phone1() ?>">
	</div>
	<div>
		<label>Телефон 2</label>
		<input type="tel" name="phone2" value="<?= $customer->phone2() ?>">
	</div>
	<div>
		<label>Паспорт</label>
		<input name="passport" value="<?= $customer->passport() ?>">
	</div>
	<div>
		<label>УНН</label>
		<input name="tin_num" value="<?= $customer->tin_num() ?>">
	</div>
	<div>
		<label>Расчётный счёт</label>
		<input name="bank_account" value="<?= $customer->bank_account() ?>">
	</div>
	<div>
		<label>Водительское удостоверение</label>
		№ <input name="dl_num" value="<?= $customer->dl_num() ?>">
		до <input name="dl_expires" type="date" value="<?= $customer->dl_expires() ?>">
	</div>
	<div>
		<label>День рождения</label>
		<input type="date" name="birth_date" value="<?= $customer->birth_date() ?>">
	</div>
	<div>
		<label>Адрес 1 (прописка или юр)</label>
		<input name="address1" value="<?= $customer->address1() ?>">
	</div>
	<div>
		<label>Адрес 2 (прож. или почтовый) </label>
		<input name="address2" value="<?= $customer->address2() ?>">
	</div>
	<div>
		<label>Скидка</label>
		<input name="discount" value="<?= $customer->discount() ?>">
	</div>
	<div>
		<input type="checkbox" id="cb-blacklist" name="blacklist"
			value="1"<?= $customer->blacklist()? ' checked' : '' ?>>
		<label for="cb-blacklist">Чёрный список</label>
	</div>
	<div>
		<label>Комментарии</label>
		<textarea name="comments"><?= $customer->comments() ?></textarea>
	</div>
	<button type="submit">Сохранить</button>
</form>

<?php _footer(); ?>
