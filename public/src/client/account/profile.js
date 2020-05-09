'use strict';


define('forum/account/profile', [
	'forum/account/header',
	'components',
], function (header) {
	var Account = {};

	Account.init = function () {
		header.init();

		app.enterRoom('user/' + ajaxify.data.theirid);

		processPage();

		socket.removeListener('event:user_status_change', onUserStatusChange);
		socket.on('event:user_status_change', onUserStatusChange);

		// B9: user note
		var FIELD_NOTE = 'note';
		function fetchNote() {
			return fetch(location.origin + '/api/user/' + app.user.username)
				.then(function (r) { return r.json(); })
				.then(function (data) {
					var noteField = data.customFields.find(function (item) { return item.name === 'Note'; }) || {};
					var noteJsonString = noteField.value || '{}';
					return JSON.parse(noteJsonString);
				});
		}
		if (app.user.uid !== 0) {
			// init input
			fetchNote()
				.then(function (note) {
					var noteForThem = note[ajaxify.data.username] || '';
					$('#profile-notes-textarea').val(noteForThem);
				})
				.catch(function (err) { console.error('fetch api/user error: ', err); });
			$('#profile-notes-btn').click(function () {
				fetchNote()
					.then(function (note) {
						var noteVal = $('#profile-notes-textarea').val();
						note[ajaxify.data.username] = noteVal;
						var payload = JSON.stringify(note);

						socket.emit(
							// ref: plugin-ns-custom-fields/client/edit/index.js
							'plugins.ns-custom-fields.saveFields',
							{
								uid: app.user.uid,
								// Note: note sure data array should be complete if we have more than one custom fields
								data: [{ name: FIELD_NOTE, value: payload }],
							},
							function (error) {
								if (error) { return app.alertError(error.message); }
								app.alertSuccess('Note is saved!');
							}
						);
					})
					.catch(function (err) { console.error('save note error: ', err); });
			});
		} else {
			$('#profile-notes-row').hide();
		}
	};

	function processPage() {
		$('[component="posts"] img:not(.not-responsive), [component="aboutme"] img:not(.not-responsive)').addClass('img-responsive');
	}

	function onUserStatusChange(data) {
		if (parseInt(ajaxify.data.theirid, 10) !== parseInt(data.uid, 10)) {
			return;
		}

		app.updateUserStatus($('.account [data-uid="' + data.uid + '"] [component="user/status"]'), data.status);
	}

	return Account;
});
