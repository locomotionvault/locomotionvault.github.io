SimilarityVis = function(_parentElement, _data, _attrConfig) {
  this.data = _data;
  this.attrConfig = _attrConfig; 

  this.settings = {
    parentElement: _parentElement,
    margin: {left:0,right:0,top:0,bottom:0},
    legend:{left:20, right:0, top:0, bottom:20},
    nodes:{left:0, right:0, top:0, bottom:140},
    fontsize:10,
  };

  this.anchoredNode = "none";

  this.initVis();
}

SimilarityVis.prototype.initVis = function() {
  var vis = this;

  vis.width = document.getElementById('similarity-vis').clientWidth- vis.settings.margin.left - vis.settings.margin.right;
  vis.height = document.getElementById('similarity-vis').clientHeight- vis.settings.margin.top - vis.settings.margin.bottom;

  vis.svgContainer = d3.select("#similarity-vis").append("svg")
              .attr("width", vis.width)
              .attr("height", vis.height);

  vis.svg = vis.svgContainer.append("g")
                .attr("transform","translate(" + vis.settings.margin.left + "," + vis.settings.margin.top + ")");
  
  vis.glinks = vis.svg.append("g");
  vis.glabels = vis.svg.append("g");
  vis.gnodes = vis.svg.append("g");

  vis.data.nodes = vis.data.nodes.sort((a,b)=> (a.group<b.group) ? -1: ((a.group>b.group) ? 1:0));
  vis.allGroups = vis.data.nodes.map(function(d){return d.group});
  vis.allGroups = [...new Set(vis.allGroups)];
  group_color = d3.scaleOrdinal().domain(vis.allGroups).range(d3.schemeTableau10);

  legend = vis.svg.selectAll("group_legend_dots").data(vis.allGroups).enter()
              .append("circle").attr("cx", vis.settings.legend.left).attr("cy", function(d,i){return vis.settings.legend.left + i*vis.settings.legend.bottom}).attr("r", 4).style("fill", function(d){ return group_color(d)});

  legend_label = vis.svg.selectAll("group_legend_labels").data(vis.allGroups).enter()
              .append("text").attr("x", vis.settings.legend.left+10).attr("y", function(d,i){ return vis.settings.legend.left + i*vis.settings.legend.bottom})
              .style("fill", 'black').text(function(d){ return d}).attr("text-anchor", "left").style("alignment-baseline", "middle").style("font-size", vis.settings.fontsize);

  vis.x = d3.scalePoint().range([35, vis.width-30]).domain(vis.data.nodes.map(function(d){return d.id}))

  vis.wrangleDataAndUpdate();
}

SimilarityVis.prototype.wrangleDataAndUpdate = function() {
  var vis = this;
  vis.updateVis();
}

SimilarityVis.prototype.updateVis = function() {
  var vis = this;
  vis.my_nodes = vis.gnodes.selectAll(".nodes").data(vis.data.nodes);//,d => d.id
  vis.my_labels = vis.glabels.selectAll(".labels").data(vis.data.nodes);
  vis.my_links = vis.glinks.selectAll(".links").data(vis.data.links);

  //enter, update nodes
  vis.settings.nodes.y = vis.height-vis.settings.nodes.bottom;
  var nodes_enter = vis.my_nodes.enter()
  					  .append("circle").attr("class","nodes")
              .merge(vis.my_nodes)
  					  .attr("cx", function(d){ return(vis.x(d.id))}).attr("cy", vis.settings.nodes.y).attr("r", 4).style("fill", function(d){ return group_color(d.group)});
  					  

  var labels_enter = vis.my_labels.enter().append("text").attr("class","labels")
						.merge(vis.my_labels)
						.text(function(d){return(d.id)})
						.style("text-anchor", "middle").style("font-size", 10).attr("transform", function(d){ return `translate(${vis.x(d.id)+3},${(vis.settings.nodes.y+70)})  rotate(-90)`});

  //enter, update links
  var links_enter = vis.my_links.enter().append('path').attr("class","links")
						.merge(vis.my_links)
						.attr('d', function (d) {
                console.log(d.source);
                console.log(d.target)
						  	start = vis.x(d.source);
						  	end = vis.x(d.target) ;
					  		return ['M', start, vis.settings.nodes.y,'A', (start - end)/2, ',', (start - end)/2, 0, 0,
					  		',',start < end ? 1 : 0, end, ',', vis.settings.nodes.y] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
					    			.join(' ');})
						.style("fill", "none").attr("stroke", "grey").style("stroke-width", 1);

  //node interactions
  nodes_enter.on('mouseover', function (d) {
		  	//dehighlight all nodes except for this one
        $("#method-tooltip").html(generateMethodToolTip(d));
        $("#details-btn").on("click", function(){
                showLocomotionModal(d.id,d,vis.attrConfig);});
        hoverOnSimilarityEffects(d);
		})
		.on('mouseout', function (d) {
      if(vis.anchoredNode.id != d.id)
        $("#method-tooltip").html(generateMethodToolTip("none"))
      resetHoverSimilarityEffects();
		})
    .on('click', function(d){
        vis.anchoredNode = d;
        d3.selectAll(".links").classed("link-achored", false);
        d3.selectAll(".nodes").classed('node-anchored',false);
        d3.selectAll(".nodes").classed('node-anchored', n => {return n.id === d.id?true:false;});   
        d.anchored = true;
          
        d3.selectAll(".links")
          .classed('link-anchored', j => {
                return j.source === d.id || j.target === d.id ? true : false;
            });
        d3.event.stopPropagation();
    });

  links_enter.on("click", function(d){
    d3.event.stopPropagation();
  });

        //exit, remove nodes
  vis.my_nodes.exit().remove();
  vis.my_labels.exit().remove();
  vis.my_links.exit().remove();
}