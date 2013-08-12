window.addEvent('domready', function() {
	// Instanciate sigma.js and customize rendering :
	var tip = $('tooltip'),
		legend = $('topics'),
		network = $('results'),
		form = document.forms[0];

	form.addEvent('submit', function(e) {
		e.stop();
		this.addClass('wait');
		(function() {
			var text = this.getElement('input').value.trim();
			loadResults('/search/' + encodeURIComponent(text));
		}).delay(100, this);
		return false;
	});
	
	loadHistogram();
	
	function loadHistogram() {
		new Request.JSON({
			url: '/summary',
			onSuccess: function(json) {
				drawCount(json.count);
				drawAuthors(json.authors);
				drawHistogram(json.group);
			},
			onFailure: function() {
				Log.write("There was an error.");
			}
		}).get();
	}
	
	function drawCount(number) {
		var counter = $('counter');
		counter.innerHTML = '<strong>Messages:</strong> ' + number; 
	}
	
	function drawAuthors(list) {
		var authors = $('authors'),
			authorPairs = [], html; 
		Object.each(list, function(value, key) {
			authorPairs.push([key, value]);
		});
		authorPairs.sort(function(a, b) {
			return b[1] - a[1];
		});
		html = authorPairs.map(function(pair) {
			return '<li><strong>'+ pair[0] +'</strong> '+ pair[1] +'</li>';
		});
		authors.innerHTML = '<ul><strong>Top contributors</strong>: ' + html.slice(0, 3).join('') + '</ul>';
	}
	
	function drawHistogram(json) {
		var container = $('chart'),
			width = container.offsetWidth,
			height = container.offsetHeight,
			dates = Object.keys(json);
		
		dates.sort(function(a, b) {
			return a.replace(/-/g, '') - b.replace(/-/g, '');
		});
		
		var html = [],
			barWidth = width / dates.length,
			counts = dates.map(function(d) { return json[d].length; }),
			max = Math.max.apply(Math, counts),
			barHeight = function (c) { return c / max * height; };
		
		dates.each(function(date, j) {
			var messages = json[date];
			messages.sort(function(a, b) {
				return new Date(a.date) - new Date(b.date);
			});
			messages.each(function(m, i) {
				html.push('<div id=\'m_' + m.message_id + '\' class=\'box\' style=\'bottom:' +
						barHeight(i) + 'px; left:' + barWidth * j + 
						'px; width:'+ barWidth +'px; height:' + 
						barHeight(1) + 'px;\'></div>');
			});
		});
		container.innerHTML = html.join('');
	}
	
	function loadResults(url) {
	    new Request.JSON({
	    	url: url,
	    	onSuccess: function(json) {
	    		selectBoxes(json.threads);
	    		renderResults(json.threads);
	    		drawAuthors(json.authors);
	    		drawCount(json.count);
	    	},
	    	onFailure: function(e) {
	    		console.error(e);
	    	}
	    }).get();
	}
	
	function renderResults(m) {
		var authors = m.map(function(t) {
			var author = t.messages.map(function(m) { return m.author; }),
				uniqueAuthor = [];
			while (author.length) {
				uniqueAuthor.push(author[0]);
				author.erase(author[0]);
			}
			return uniqueAuthor;
		});
		var html = m.map(function(m, i) {
			return '<div class=\'entry\'>' +
				'<h1><a href=\'#\'>' + m.subject + '</a> <span class=\'number\'>'+ m.messages.length +'</span></h1>' +
				'<div class=\'summary\'>' + 'Authors <span class=\'author\'>' + authors[i].slice(0, 3).join(', ') + 
				(authors[i].length > 3 ? ', ...' : '') + '</span> from <time>' + 
				new Date(m.from.slice(0, 10)).toString().slice(0, 15) + '</time> to <time>'+ 
				new Date(m.to.slice(0, 10)).toString().slice(0, 15) + '</time></div>' +
				'<div class=\'body\'><ul><li>' + m.messages.join('</li><li>') + '</li></ul></div>' + 
				'</div>';
		});
		$('results').innerHTML = html.join('');
	}
	
	function selectBoxes(m) {
		var boxes = $$('#chart div.box');
		boxes.removeClass('selected');
		m.each(function(m) {
			m.messages.each(function(m) {
				$('m_' + m.message_id).addClass('selected');
			});
		});
	}

});
