function showLocomotionModal(locomotionId, locomotionData, attrConfig){

	UIkit.modal("#locomotion-modal").show();
	$("#locomotion-modal-title").text(locomotionId)

	// media = '<div class="uk-card uk-card-default uk-card-body">'+imageSlider+'</div>'

	// $("#modal-figure-slider").html(generateFigureSlider(locomotionData))
	// if(numMedia>1){
	// 	$("#locomotion-media").html(generateVideoFrame(locomotionData.video)
	// }
	var attribute_groups = d3.nest()
						 .key(function(d) { return d.parent; })
						 .entries(attrConfig.attributes);
	console.log(attribute_groups)

	$("#modal-figure-slider").html(generateFigureSlider(locomotionData))
	$("#locomotion-attributes").html(generateAttributeTable(locomotionData,attribute_groups))
}


function generateFigureSlider(method) {
  slider = "";

  slider =  '<li><img src="./Gifs/' +method.figure +'" alt=""></li>'
  
  // method.figures.forEach(function(d, index) {
  //     slider += '<li>\
  //                 <img src="./figures/' +d +'" alt="">\
  //               </li>';
  //   });
	  
  return slider;
}

function generateAttributeTable(locomotionData,attribute_groups){
	result = "";
	attribute_groups.forEach(function(attribute_group, index) {
		result_inner = "";
		attributeList = attribute_group.values.filter(function(d){return d.display});
	  	attributeList.forEach(function(attribute, index){
	  		attr_title = attribute["title"];
	  		attr_value = locomotionData[attribute.key]?locomotionData[attribute.key]:"-";
	  		result_inner +='<div class="table-attr uk-width-1-4"><span>'+attr_title+': </span></div><div class="uk-width-3-4"><span>'+attr_value +'</span></div>';
	  	});
  	result += '<div class="table-title">'+attribute_group.key.toUpperCase()+'</div><div class="uk-grid-collapse" uk-grid>'+result_inner+'</div><hr>';

  	});

  return result;

}


