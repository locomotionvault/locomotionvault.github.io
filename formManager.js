FormManager = function(_config, _parent, _data) {
  this.attributes = _config.attributes;
  // this.parameters = _defaultConfig.parameters;
  this.data = _data;

    this.settings = {
    parentElement: _parent,
    margin: { top: 5, right: 10, bottom: 0, left: 10 },
    attributeTitleWidth: 240,
    rowHeight: 25,
    rowParentHeight: 25,
    rowParentBottom: 25,
    height:0
  }

  this.initForm();
  // this.createFilterConfigModal();
}


// FormManager.prototype.initForm = function() {

//   var manager = this;

//   d3.select("#" + manager.settings.parentElement).select("svg").remove();

//   manager.svgContainer = d3.select("#" + manager.settings.parentElement).append("svg");

//   manager.svg = manager.svgContainer.append("g")
//       .attr("transform", "translate(" + vis.settings.margin.left + "," + vis.settings.margin.top + ")");
      
//   manager.attributeTitles = vis.svg.append("g")
//       .attr("class", "attribute-titles");

// };

FormManager.prototype.initForm= function() {
  var manager = this;


  manager.nestedAttrs = d3.nest()
      .key(function(d) { return d.parent; })
      .entries(manager.attributes);

  $("#"+manager.settings.parentElement).empty();

   manager.nestedAttrs.forEach(function(attrGroup) {
   
    // Append new accordion child element for each filter group
    $("#"+manager.settings.parentElement).append('<div id="form-' + attrGroup.key +'"></div><hr>');

      attrGroup.values.forEach(function(attrElem) {
        switch(attrElem.type) {
          case "textbox":
          		manager.createText(attrElem, attrGroup.key,'textbox');
          		break;
  		  case "textarea":
  		  		manager.createText(attrElem, attrGroup.key,'textbox-area');
  		  		break;
  		  case "similarity":
  		  		manager.createSimilaritySearch(attrElem, attrGroup.key);
  		  		break;
          case "multi_select":
              	manager.createRadioGroup(attrElem, attrGroup.key);
              	break;
          case "checkbox":
          	  	console.log("checkbox");
              	manager.createRadioGroup(attrElem, attrGroup.key);
              
              	break;
          default:
              	console.log("do nothing");
          }
      });
  });
}

FormManager.prototype.createText = function(attrElem, attrGroup,type) {
	var textResult;
	if(type=='textbox'){
		textResult = '<div class="attr-textbox" data-input="form-'+ attrElem.key +'" uk-grid><div class="input-title uk-width-1-4">'+ attrElem.title +'</div><input class="uk-input uk-width-3-4" type="text"></input></div>';
	}
	else if(type=='textbox-area'){
		textResult = '<div class="attr-textbox" data-input="form-'+ attrElem.key +'" uk-grid><div class="input-title uk-width-1-4">'+ attrElem.title +'</div><textarea class="uk-textarea uk-width-3-4" rows="4"></textarea></div>';
	}

	$('[id="form-'+ attrGroup +'"]').append(textResult);

}

FormManager.prototype.createRadioGroup = function(attrElem, attrGroup) {
  var manager = this;
  var radioboxDomain=[];

  
  if(attrElem.values)
  {
  	radioboxDomain = attrElem.values;//HS: this could be problematic if value and key are not the same
  }

  else{
	radioboxkeys = manager.data.nodes.map(d => d[attrElem.key]);
	radioboxkeys = [].concat.apply([], radioboxkeys);
	radioboxkeys = [...new Set(radioboxkeys)].sort();
	radioboxkeys.forEach(function(radiokey,index){
		radioboxDomain.push({"title":radiokey, "value":radiokey});
	});
  }

  console.log(radioboxDomain);

  
  var radioboxes = "", radioResult;

    
  radioboxDomain = radioboxDomain.filter(function(d) {
    return d != null;
  });

  radioboxDomain.forEach(function(attrValue, index) {
    radioboxes += '<div><label class="attr-radiobox-label"><input class="uk-radio" name="'+attrElem.key+'" value="'+ attrValue.value +'" type="radio"> <span>'+ attrValue.value +'</span></label></div>';
  });

  numValues = radioboxDomain.length +1;
  w1 = 'uk-width-1-5'//'uk-width-1-'+numValues;
  w2 = 'uk-width-4-5'//'uk-width-'+numValues-1+'-'+numValues;
  radioResult = '<div class="attr-radioboxes uk-margin" data-input="form-'+ attrElem.key +'" uk-grid><div class="input-title '+w1+'">'+ attrElem.title +'</div><div class="uk-grid-small '+w2+'" uk-grid>'+ radioboxes +'</div></div>';

  $('[id="form-'+ attrGroup +'"]').append(radioResult);
}


FormManager.prototype.createSimilaritySearch = function(attrElem, attrGroup) {
	//create the field
	manager = this;
	var searchBoxResult = '<div class="attr-textbox" data-input="form-'+ attrElem.key +'" uk-grid><div class="input-title uk-width-1-4">'+ attrElem.title +'</div><div class="uk-width-3-4"><input id="similarity-textbox" class="uk-input" type="search"></input>';
	searchBoxResult += '<div id="search-results-container"><div id="search-results-msg"></div><ul id="search-results"></ul></div></div></div>'
	$('[id="form-'+ attrGroup +'"]').append(searchBoxResult);

	/** Add the search functionality **/
	//Listen to search query
	console.log("just before attaching event handler")
	$("#similarity-textbox").on('keyup change', function () {
		// console.log("in similarity event handler")
		var searchStr = this.value;
		startIdx = searchStr.lastIndexOf(",")>0 ? searchStr.lastIndexOf(",")+1:0;
		console.log(startIdx);
		searchStr = searchStr.substr(startIdx);

	    if(searchStr.length <= 1) {
	      $("#search-results-container").fadeOut();
	      return;
	    }
	    
	    allMethods = manager.data.nodes;//.map(d => d.id);

	    var results = allMethods.filter(function(d){
	    	return d.id.toLowerCase().startsWith(searchStr.toLowerCase())
	    });
	    // console.log(results)
    
	    $("#search-results").empty();
	    
	    results.forEach( function(d) {
	      var resultItem = '<span class="search-result" data-method="'+ d.id +'"><a class="search-result-title">'+d.id+'</a>';
	      // resultItem += d.id;
	      
	      $("#search-results").append("<li>" + resultItem + "</li>")
	    });
	    
	    if(results.length == 0)
	      $("#search-results-msg").text("There are no records that match your search.");
	    else
	      $("#search-results-msg").text("");
	    
	    $("#search-results-container").fadeIn();
	});//end of click keyup change event

	//Hide dropdown (search results) when user clicks outside
	$(document).mouseup(function(e) {
	  var searchResults = $("#search-results-container");
	  var searchField = $("#similarity-textbox");
	  
	  // If the target of the click isn't the container nor a descendant of the container
	  if(!searchResults.is(e.target) && searchResults.has(e.target).length === 0 && !searchField.is(e.target))
	    searchResults.hide();
	});

	//enable click functionality for found items
	$("#search-results").on("click",".search-result-title",function(){
		var newMethod = this.innerText;
		console.log(this.innerText)
		currentText = $("#similarity-textbox").val();
		currentMethods = currentText.substr(0, currentText.lastIndexOf(",")+1);
		// currentText.split(",")
		$('#similarity-textbox').val(currentMethods+newMethod+","); 
	})
}

