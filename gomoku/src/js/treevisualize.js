function requestTree() {

  var  request = new XMLHttpRequest();
  request.open('POST', '/visualize');

  request.onreadystatechange = function() {
    if (request.readyState != 4 || request.status != 200)
      return;

    drawTree(JSON.parse(request.responseText));
  }

  request.send("requesting mct");
}

function removeTree() {
  d3.select("#tree-visualize svg").remove();
}

function drawTree(treeData) {
  // Set the dimensions and margins of the diagram
  var margin = {top: 20, right: 90, bottom: 30, left: 90},
  width = 1400 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("#tree-visualize").append("svg")
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate("+ margin.left + "," + margin.top + ")");

  var idCounter = 0, duration = 750, root;

  // declares a tree layout and assigns the size
  var mctsTree = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth.
  // Sort childrens by total simulations in descendant order.
  root = d3.hierarchy(treeData, function(d) { return d.children; })
           .sort(function(child1, child2) {
  return child2.data.totalCount - child1.data.totalCount;
  });

  root.x0 = height / 2;
  root.y0 = 0;

  update(root);


  function update(source) {
    // Assigns the x and y position for the nodes
    // var treeData = treemap(root);
    var treeData = mctsTree(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
    links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 100});

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++idCounter); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function(d) {
          return d.data.isWinning ? "lightblue" : d.data.isLosing ? "red" : "#fff";
        });

    // Add labels for the nodes
    // labels of a leaf node will be at the right of the node,
    // otherwise, it will be above the node.
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
          return d.children || d.hiddenChildren ? 0 : 13;
        })
        .attr("y", function(d) {
          return d.children || d.hiddenChildren ? -15 : 0;
        })
        .attr("text-anchor", function(d) {
          return d.children || d._children ? "middle" : "start";
        })
        .text(function(d) { return "(" + String.fromCharCode(65 + d.data.c) + (d.data.r + 1) + ")";
        });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) {
           return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', function(d) {
           return Math.log(d.data.totalCount);
        })
        .style("fill", function(d) {
           return d.data.isWinning ? "lightblue" : d.data.isLosing ? "red" : "#fff";
        })
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
          return diagonal(o, o)
        })
        .attr("title", function(d){return d.data.totalCount;})
        .style("stroke-width", function(d){
          // set the link's stroke-width according to total simulation count.
                          return Math.pow(d.data.totalCount, 1/3) + "px";
        })
        .style("stroke", function(d) {
          var winRate = d.data.winCount / d.data.totalCount;
          var loseRate = d.data.loseCount / d.data.totalCount;
          console.log((winRate - loseRate + 1) / 2);
          console.log(gradient( (winRate - loseRate + 1) / 2 ));
          return gradient( (winRate - loseRate + 1) / 2 );
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

      path = `M ${s.y} ${s.x}
      C ${(s.y + d.y) / 2} ${s.x},
      ${(s.y + d.y) / 2} ${d.x},
      ${d.y} ${d.x}`;

      return path;
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d.hiddenChildren = d.children;
        d.children = null;
      } else {
        d.children = d.hiddenChildren;
        d.hiddenChildren = null;
      }
      update(d);
    }

    function gradient(level) {
      var hStart = 0 // red
      var hEnd = 240 //blue

      h = hStart + (hEnd - hStart) * level;
        return `hsl(${h},100%,45%)`;
    }
  }
}