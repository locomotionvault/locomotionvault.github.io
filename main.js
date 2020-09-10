//variables and default settings
 var originalData_nodes, originalData_links, originalData_attribute_groups, mydata,defaultAttrConfig;
 var galleryVis, similarityVis, fM, formM;
 var defaultConfig = {};
// read data
 Promise.all([
    d3.json("./data/locomotionvault-10-09-2020.json"),//locomotionvault-30-08-2020.json"),
    d3.json("./data/filterConfig.json")
	]).then(function(files) { 
		data = files[0];
		defaultAttrConfig = files[1];
		console.log(data);
		console.log(defaultAttrConfig)

		originalData_nodes = data.nodes;
		originalData_links = data.links;
		// originalData_attribute_groups = d3.nest()
		// 							      .key(function(d) { return d.parent; })
		// 							      .entries(defaultAttrConfig);//data.attribute_groups;
		mydata = data;

		// console.log(originalData_attribute_groups)

		//initialize filtermanger
		 fM = new FilterManager(defaultAttrConfig, mydata);
		 formM = new FormManager(defaultAttrConfig,"myform-fields", mydata);

		//initialize views
		 $("#n-methods").text("(" + data.nodes.length + ")");
		 galleryVis = new Gallery("gallery-vis", mydata, defaultAttrConfig);
		 similarityVis = new SimilarityVis("similarity-vis", mydata, defaultAttrConfig);

	});


function filterData() {
  console.log("In filter data");
  // data = originalData; 
  nodes = originalData_nodes;
  links = originalData_links;
  // console.log(originalData);

  nodes = nodes.filter( function(d) {
    var decision = true;
    fM.filters
      .filter(function(d) {
        return d.active;
      })
      .forEach(function(activeFilter) {
        switch(activeFilter.valueMatching) {
          // Check if at least 1 value overlaps between two arrays
    	    case "arrayIntersection":
    	    break;
    	    case "range":
	            if(d[activeFilter.key] < activeFilter.selectedValues[0] || d[activeFilter.key] > activeFilter.selectedValues[1])
	              decision = false;
              if(d[activeFilter.key] =="")
                decision = true;
            break;
    	    default:
    	    	// console.log("Loop - In filter data "); 
    	    	// console.log(activeFilter.selectedValues);
    	    	// console.log(activeFilter.key);
    	    	// console.log(d[activeFilter.key]);
            	if(!activeFilter.selectedValues.includes(d[activeFilter.key]))
              		decision = false;
    	}
    });

    return decision;
  });

  var currNodes = nodes.map(nodes => nodes.id);

  links = links.filter(function(d){	
  	var decision = true;
  	// console.log(currNodes)
  	if(!currNodes.includes(d.source) || !currNodes.includes(d.target))
  		// console.log("in false");
  		decision = false;
  	return decision;

  });
  mydata.nodes = nodes;
  mydata.links = links;
  mydata.attribute_groups = originalData_attribute_groups;
  console.log(mydata.attribute_groups)
}

function updateViews() {

	filterData();
	$("#n-methods").text("(" + data.nodes.length + ")");

	//update visualizations
	galleryVis.data = mydata;
	galleryVis.wrangleDataAndUpdate();
	similarityVis.data = mydata;
	similarityVis.wrangleDataAndUpdate();
}


/*** Sidebar filter ***/

// Multi-select
$("#filter-controls").on("click", ".filter-button-group .uk-button", function () {
  $(this).toggleClass("active");
  var currFilter = $(this).parent().attr("data-filter");
  
  // Collect all active buttons
  var multiSelectValues = $(this).parent().children(".active").map(function() {
    return $(this).attr("data-value");
  }).get();


  //var customValueMatching = $(this).parent().data("matching") || "inArray";
  
  var nOfOptions = $(this).parent().children().length;
  if(nOfOptions == multiSelectValues.length || multiSelectValues.length == 0) {
    //cM.removeParam(currFilter);
    fM.removeActiveFilter(currFilter);
    // cM.updateFilterParam();
  } else {
    //cM.setParam(currFilter, multiSelectValues.join(","));
    fM.addActiveFilter(currFilter, multiSelectValues);
    // cM.updateFilterParam();
    //fM.addActiveFilter({ key: currFilter, values: multiSelectValues, valueMatching: customValueMatching });
  }
  updateViews();
});


$("#filter-controls").on("change", ".filter-checkboxes input:checkbox", function () {
  var parentElementSelector = $(this).closest(".filter-checkboxes");
  var currFilter = parentElementSelector.attr("data-filter");
  var enabledCheckboxes = getEnabledCheckboxes('.filter-checkboxes[data-filter="'+ currFilter +'"]', null);
  var nOfOptions = parentElementSelector.find("input:checkbox").length;

  if(nOfOptions == enabledCheckboxes.length || enabledCheckboxes.length == 0) {
    //cM.removeParam(currFilter);
    fM.removeActiveFilter(currFilter);
  } else {
    //cM.setParam(currFilter, enabledCheckboxes.join(","));
    fM.addActiveFilter(currFilter, enabledCheckboxes);
    //fM.addActiveFilter({ key: currFilter, values: enabledCheckboxes.join(","), valueMatching: "arrayIntersection" });
  }
  updateViews();
});


$("#new-method-button").click(function(){
	console.log("in click");
	UIkit.modal("#form-modal").show();
	formM.initForm();
});

function getEnabledCheckboxes(parentElement, dataAttribute) {
  var checkboxValues = $(parentElement + " input:checkbox:checked").map(function() {
    return dataAttribute ? $(this).attr("data-" + dataAttribute) : $(this).val();
  }).get();

  return checkboxValues;
}

function generateMethodToolTip(method){
  
  if(method=="none")
    return "";

  methodThumbnail = '<div class="uk-cover-containerx tooltip__thumbnail"><img src="./Gifs/' +  method.figure + '" alt=""></div>'

  // if (method.figure.length>0)
  //   methodThumbnail = '<div class="uk-cover-containerx tooltip__thumbnail"><img src="./Gifs/' +  method.figure[0] + '" alt=""></div>'
  // else 
  //   methodThumbnail='<div class="uk-cover-containerx tooltip__thumbnail"><img src="./Gifs/FingerRun.png" alt=""></div>'
  
  result = '<div class="uk-card uk-card-default uk-card-small tooltip__card">'
            // + '<div class="gallery-item__header uk-padding-small">' + method.id + '</div>'
            + methodThumbnail
            +'</div>';
  return result;
}

function hoverOnSimilarityEffects(d){
  var nodes_enter = d3.selectAll(".nodes");
  var links_enter = d3.selectAll(".links");
  var labels_enter = d3.selectAll(".labels");

  nodes_enter.style('opacity', function(node_d){
        var decision = node_d.id === d.id?1:.2;
        mydata.links.forEach(function(link){
          if ((link.source ===d.id && link.target === node_d.id) || (link.target ===d.id && link.source === node_d.id)){
            decision = 1;}
        });
        return decision;
  });

  nodes_enter.style('stroke', function(node_d){return node_d.id === d.id?'black':'none';      });
  nodes_enter.style('stroke-width', function(node_d){return node_d.id === d.id?2:1; });

  // Highlight the connections
  links_enter.style('stroke', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 'black' : '#b8b8b8';})
    .style('stroke-opacity', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 1 : .2;})

  // Highlight connection labels
  labels_enter.style("opacity", function(label_d){
    var decision = label_d.id === d.id ? 1 :.3;
    mydata.links.forEach(function(link){
      if ((link.source ===d.id && link.target === label_d.id) || (link.target ===d.id && link.source === label_d.id)){
        decision = 1;
      }
    });
    return decision;
  });
}

function resetHoverSimilarityEffects(){
  d3.selectAll(".nodes").style('opacity', 1).style('stroke', 'none');
  d3.selectAll(".links").style('stroke', 'grey').style('stroke-opacity', .8).style('stroke-width', '1');
  d3.selectAll(".labels").style("font-size", 10 ).style("opacity",1); 
}
// $("#form-modal").on('click', ".similarity-textbox input:textbox", function () {
// 	console.log("in similarity event handler")
// 	var searchStr = this.value;
//     if(searchStr.length <= 2) {
//       // $("#search-results-container").fadeOut();
//       return;
//     }
    
//     allMethods = manager.data.nodes.map(d => d.id);

//     var results = allMethods.filter(function(d){
//     	return d.startsWith(searchStr)
//     });
//  });

