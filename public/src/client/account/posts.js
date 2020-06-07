'use strict';


define('forum/account/posts', ['forum/account/header', 'forum/infinitescroll'], function (header, infinitescroll) {
	var AccountPosts = {};
	var method;
	var template;

	AccountPosts.init = function () {
		header.init();

		$('[component="post/content"] img:not(.not-responsive)').addClass('img-responsive');

		AccountPosts.handleInfiniteScroll('posts.loadMoreUserPosts', 'account/posts');

		// B5: search posts
		function searchPosts(keyword) {
			if (!keyword) {
				$('ul > li.posts-list-item').each(function () {
					$(this).show();
				});
				return true;
			}
			$('ul > li.posts-list-item').each(function () {
				if (($(this).find('[component="post/content"]').text() || '').toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
					($(this).find('a.topic-title').text() || '').toLowerCase().indexOf(keyword.toLowerCase()) > -1
				) {
					$(this).show();
				} else {
					$(this).hide();
				}
			});
		}

		// search bar
		$('#posts-search-btn').click(function () {
			var keyword = $('#posts-search-input').val();
			searchPosts(keyword);
		});

		// filter button
		var authorsMap = {};
		$('ul > li.posts-list-item [component="post/content"] > p')
			.each(function () {
				var extractedAuthor = (($(this).text() || '').match(/@\w+/g) || [])[0];
				if (extractedAuthor) {
					authorsMap[extractedAuthor] = true;
				}
			});
		var authors = Object.keys(authorsMap).sort();
		authors.forEach(function (author) {
			$('#posts-search-tags').append('<button type="button" class="btn btn-link">' + author + '</button>');
		});
		$('#posts-search-tags > button').each(function () {
			var author = $(this).text() || '';
			$(this).click(function () {
				searchPosts(author);
				$('#posts-search-input').val(author);
			});
		});
	};

	AccountPosts.handleInfiniteScroll = function (_method, _template) {
		method = _method;
		template = _template;
		if (!config.usePagination) {
			infinitescroll.init(loadMore);
		}
	};

	function loadMore(direction) {
		if (direction < 0) {
			return;
		}

		infinitescroll.loadMore(method, {
			uid: ajaxify.data.theirid,
			after: $('[component="posts"]').attr('data-nextstart'),
		}, function (data, done) {
			if (data.posts && data.posts.length) {
				onPostsLoaded(data.posts, done);
			} else {
				done();
			}
			$('[component="posts"]').attr('data-nextstart', data.nextStart);
		});
	}

	function onPostsLoaded(posts, callback) {
		app.parseAndTranslate(template, 'posts', { posts: posts }, function (html) {
			$('[component="posts"]').append(html);
			html.find('img:not(.not-responsive)').addClass('img-responsive');
			html.find('.timeago').timeago();
			app.createUserTooltips();
			utils.makeNumbersHumanReadable(html.find('.human-readable-number'));
			callback();
		});
	}

	return AccountPosts;
});
