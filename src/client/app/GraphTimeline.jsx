import React from 'react';

import styles from './graphtimeline.css'

class GraphTimeline extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            onNodeSelected: props.onNodeSelected,
            graph: props.graph,
            selectedNode: null,
            relativeTimestamp:Date.now()
        };
        this.selectNode = this.selectNode.bind(this);
        setInterval(()=>{this.state.relativeTimestamp = Date.now(); this.setState(this.state)},50);
    }

    componentDidMount() {

    }

    selectNode(node) {
        this.state.selectedNode = node;
        this.setState(this.state);
        this.state.onNodeSelected(this.state.graph, node);
    }

    createWaitingElem(idx,nodeHeight,fromTs,duration){
      let createboxStyle = {
          position: 'absolute',
          height: '20px',
          width: 1,
          top: '' + (idx * nodeHeight) + 'px',
          left: fromTs
      };

      let depLineStyle = {
          position: 'absolute',
          width: duration + 'px',
          height: '1px',
          top: '' + ((idx * nodeHeight) + nodeHeight / 2 - 5) + 'px',
          left: fromTs
      };

      return(<div>
        <div className={styles.createnode} style={createboxStyle}>&nbsp;</div>
      <div className={styles.hdepline} style={depLineStyle}>&nbsp;</div>
      </div>);
    }

    render() {
        let completedTime = null;
        let nodes = this.state.graph.getNodes();


        let minCreateTime = nodes.reduce((v, n) => Math.min(v, n.created), Infinity);

        let maxTime = nodes.reduce((v, n) => Math.max(v, n.completed), -Infinity);

        console.log(`graph timelines are ${this.state.graph.created} ->${minCreateTime} -> ${maxTime}`);


        let startTs = this.state.graph.created;

        let relativeX = function (timeStamp) {
            return (timeStamp - startTs) * 0.06;
        };

        let lifeWidth;
        if (this.state.graph.main_ended !== null){
          lifeWidth = relativeX(this.state.graph.main_ended);
        } else {
          lifeWidth = 1024;
        }
        let mainLifeStyle = {
            position: 'absolute',
            height: '20px',
            width: '' + lifeWidth + 'px',
            top: '0px',
            left: '0px'
        };

        console.log("Ended: " + this.state.graph.main_ended);

        let lifeElem = (<div key='0'>
        <div className={styles.node + ' ' + styles.lifecycle} style={mainLifeStyle}> {this.state.graph.function_id} </div>
         </div>);

        let pendingElems = [];
        let nodeElements =[];

        nodeElements.push(lifeElem);

         nodes.forEach((node,idx) => {
            let createTs = relativeX(node.created);

            var styleExtra = '';
            switch (node.state) {
                case 'failed':
                    styleExtra = styles.failed;
                    break;
                case 'successful':
                    styleExtra = styles.successful;
                    break;
                case 'running':
                    styleExtra = styles.running;
                    break;
                case 'pending':
                    styleExtra = styles.pending;
                    break;

            }
            if (this.state.selectedNode === node) {
                styleExtra += ' ' + styles.selected;
            }
            const nodeHeight = 30;




            let deps = ""
            if(node.dependencies.length !== 0){
              deps = "Dependencies: Stage " + node.dependencies;
            }

            if(node.state === 'pending'){
              let pendingboxStyle = {
                  position: 'absolute',
                  height:'20px',
                  top: '' + ((idx+1) * nodeHeight) + 'px',
              };
              let pendElem = (<div key={node.stage_id + 1} className={styles.node + ' ' + styleExtra}
                   style={pendingboxStyle}
                   onClick={(e) => this.selectNode(node)}
                   data-tooltip={node.op + ": " + node.state + "\n" + deps}
                   > {node.stage_id}:{node.op} </div>);
              pendingElems.push(pendElem);
              let waitElem = this.createWaitingElem(idx,nodeHeight,createTs,relativeX(this.state.relativeTimestamp) - createTs);
              nodeElements.push(<div key={node.stage_id + 1}>{waitElem}</div>);

            }else{
              let startTs = relativeX(node.started);
              let duration = relativeX(node.completed) - relativeX(node.started);

              let waitingTime = startTs - createTs;
              let waitElem;
              if (waitingTime > 10) {
                 waitElem= this.createWaitingElem(idx,nodeHeight,createTs,waitingTime);
              }

              let runboxStyle = {
                  position: 'absolute',
                  height: '20px',
                  width: '' + duration + 'px',
                  top: '' + ((idx+1) * nodeHeight) + 'px',
                  left: startTs
              };
            nodeElements.push (<div key={node.stage_id + 1}>
                    {waitElem}
                    <div className={styles.node + ' ' + styleExtra}
                         style={runboxStyle}
                         onClick={(e) => this.selectNode(node)}
                         data-tooltip={node.op + ": " + node.state + "\n" + deps}
                         > {node.stage_id}:{node.op} {duration?(duration.toFixed(0) + 'ms'):""}</div>
                    </div>

            );
          }
        });

        let widthDiff = 700;

        let thisStyle;

        if((this.state.graph.finished < this.state.relativeTimestamp) && (this.state.graph.finished !== null)){
          let timePlus = relativeX(this.state.graph.finished) + 10;
          widthDiff = widthDiff - timePlus;
          thisStyle = {left: '0px', width:timePlus + 'px'};
        } else {
          widthDiff = widthDiff - (relativeX(this.state.relativeTimestamp));
          thisStyle = {left: widthDiff, width: '1024px'};
        }


        return (
          <div>
            <div className={styles.outerView}>
                <div className={styles.viewport} style={{overflowX:'scroll'}} >
                  <div className={styles.innerViewport} id="innerViewport" style={thisStyle}>
                    {nodeElements}
                  </div>
                </div>
                <div>{pendingElems}</div>
            </div>
          </div>
        );
    }
}

export default GraphTimeline;
