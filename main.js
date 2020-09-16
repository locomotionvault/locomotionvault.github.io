//variables and default settings
 var originalData_nodes, originalData_links, originalData_attribute_groups, mydata,defaultAttrConfig, similarityCriteria;
 var galleryVis, similarityVis, fM, formM;
 var defaultConfig = {};
// read data
 Promise.all([
    d3.json("./data/locomotionvault-16-09-2020.json"),//locomotionvault-30-08-2020.json"),
    d3.json("./data/filterConfig.json")
	]).then(function(files) { 
		data = files[0];
		defaultAttrConfig = files[1];
    similarityCriteria = "dvt"

    data = calcSimilarity(data);

		originalData_nodes = data.nodes;
		originalData_links = data.links;
		mydata = data;

		//initialize filtermanger
		 fM = new FilterManager(defaultAttrConfig, mydata);
		 //formM = new FormManager(defaultAttrConfig,"myform-fields", mydata);

		//initialize views
		 $("#n-methods").text("(" + data.nodes.length + ")");
		 galleryVis = new Gallery("gallery-vis", mydata, defaultAttrConfig);
		 similarityVis = new SimilarityVis("similarity-vis", mydata, defaultAttrConfig);
     updateViews()

	});

function calcSimilarity(data){
  data.nodes.forEach(function(node,index){
    var similarLTs = ""
    data.links.forEach(function(link){
      if (link.source == node.id && link.value_dvt>=0.5){
        similarLTs += link.target
        similarLTs += ", "
      }
      if (link.target == node.id && link.value_dvt>=0.5){
        similarLTs += link.source
        similarLTs += ", "
      }
    });
    if(similarLTs !="")
      similarLTs = similarLTs.substring(0, similarLTs.length - 2);
    node["similarity"] = similarLTs;
   // console.log("similarLTs: "+similarLTs);

  });
  return data;
}

function filterNodes() {
  nodes = originalData_nodes;
  links = originalData_links;

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
            	if(!activeFilter.selectedValues.includes(d[activeFilter.key]))
              		decision = false;
    	}
    });

    return decision;
  });

  var currNodes = nodes.map(nodes => nodes.id);

  links = links.filter(function(d){	
  	var decision = true;
  	if(!currNodes.includes(d.source) || !currNodes.includes(d.target))
  		decision = false;
  	return decision;

  });
  mydata.nodes = nodes;
  mydata.links = links;
  mydata.attribute_groups = originalData_attribute_groups;
  // console.log(mydata.attribute_groups)
}

function filterSimilarity(){
  links = mydata.links;
  var simThreshold = $("#similarity-threshold-slider").val();
  links = links.filter(function(d){ 
          var decision = true;
          if(similarityCriteria=="dvt" && d.value_dvt<simThreshold)
            decision = false;
          if(similarityCriteria=="dit" && d.value_dit<simThreshold)
            decision = false;
    return decision;
  });

  mydata.links = links;
}

function updateViews() {

	filterNodes();
  filterSimilarity();
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
    fM.removeActiveFilter(currFilter);
  } else {
    fM.addActiveFilter(currFilter, multiSelectValues);
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


$("#similarity-threshold-slider").on("change",function(event){
  newValue =$(this).val();
  $("#similarity-threshold-val").text(newValue);
  updateViews()

});

$("#similarity-threshold-slider").on("click",function(event){
  event.stopPropagation() 
})
$(".similarity-radio").on("click",function(event){
  similarityCriteria = $(this).val()
  updateViews()
  event.stopPropagation() 
})

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
  button = '<button id="details-btn" class="uk-button uk-button-small">See details</button>'
  result = '<div class="uk-card uk-card-default uk-card-small tooltip__card">'
            + methodThumbnail
            +button
            +'</div>';
  return result;
}

$("#similarity-vis").click(function(){
  console.log("clicked ...")
  $("#method-tooltip").html("");
  d3.selectAll(".nodes").style('opacity', 1).style('stroke', 'none');
  d3.selectAll(".links").style('stroke', 'grey').style('stroke-opacity', .7).style('stroke-width', '1');
  d3.selectAll(".labels").style("font-size", 10 ).style("opacity",1); 
  d3.selectAll(".nodes").classed('node-anchored',false)
  d3.selectAll(".links").classed("link-anchored",false);
});

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
  d3.selectAll(".links").style('stroke', 'grey').style('stroke-opacity', .7).style('stroke-width', '1');
  d3.selectAll(".labels").style("font-size", 10 ).style("opacity",1); 
  d3.selectAll(".node-anchored").style('stroke','black').style('stroke-width',2);
  d3.selectAll(".link-anchored").style('stroke','black').style('stroke-opacity',1).style('stroke-width',1.5);
}

