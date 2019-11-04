"use strict";

import React from 'react';
import ReactDOM from 'react-dom';

function formatNumber(x) {
  return Math.round(x * 100) / 100;
}

// Returns an array containing 0 to x-1.
function range(x) {
  const a = [];
  for (let i = 0; i < x; ++i)
    a.push(i);
  return a;
}

function sortFunction(a, b) {
  return a - b;
}

function findMedian(values) {
  const len = values.length;
  if (len == 0)
    return 0;
  values.sort(sortFunction);
  if (len % 2 == 1)
    return values[(len - 1) / 2];
  return (values[len/2 - 1] + values[len/2]) / 2;
}

function makePhantoms(scheme, n, t) {
  if (scheme == "no_phantoms")
    return [];
  const phantoms = [];
  for (let k = 0; k <= n; ++k) {
    let x;
    if (scheme == "uniform_phantoms") {
      x = 1 - k/n;
    } else if (scheme == "median") {
      if (n + 1 <= 2 * k) {
        x = 0;
      } else if (n <= 2 * k) {
        x = 0.5;
      } else {
        x = 1;
      }
    } else if (scheme == "independent_markets") {
      x = Math.min(t * (n - k), 1);
    } else if (scheme == "welfare_maximizing") {
      if (t <= k / (n+1)) {
        x = 0;
      } else if (t < (k+1) / (n+1)) {
        x = t * (n+1) - k;
      } else {
        x = 1;
      }
    }
    phantoms.push(x);
  }
  return phantoms;
}

// Groups labels that have the same y position into the same line.
function groupLabels(a) {
  a.sort((x, y) => {
    if (x.x < y.x) return 1;
    if (x.x > y.x) return -1;
    if (x.type < y.type) return 1;
    if (x.type > y.type) return -1;
    if (x.i < y.i) return -1;
    if (x.i > y.i) return 1;
    return 0;
  });
  let i = 0;
  const len = a.length;
  const ret = [];
  let k = 0;
  while (i < len) {
    const x = a[i].x;
    const tmp = [a[i].label];
    while (i + 1 < len && a[i + 1].x == a[i].x) {
      const label = a[i + 1].label;
      if (tmp.length > 0) {
        tmp.push(<span className="comma" key={"c" + k}>,</span>);
        k++;
      }
      tmp.push(label);
      i++;
    }
    ret.push({label: tmp, x: x});
    i++;
  }
  return ret;
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      n: 0, // Number of voters
      m: 0, // Number of alternatives
      profile: [], // An n x m matrix
      scheme: "uniform_phantoms",
      t: 0,
      inputText: "",
      inputError: null
    };

    this.handleChangeInputText = this.handleChangeInputText.bind(this);
    this.handleChangeScheme = this.handleChangeScheme.bind(this);
    this.handleChangeT = this.handleChangeT.bind(this);
  }

  componentDidMount() {
    this.parse("1 0\n1 0\n1 0\n0 1\n0 1\n");
  }

  handleChangeInputText(event) {
    const inputText = event.target.value;
    this.parse(inputText);
  }

  parse(inputText) {
    const s = inputText.replace(/,/g, "");
    const profile = [];
    let inputError = null;
    for (const line of s.split("\n")) {
      const tmp = [];
      for (let x of line.split(" ")) {
        x = x.trim();
        if (x.length == 0)
          continue;
        if (isNaN(x)) {
          inputError = "Not a number";
        } else if (+x > 1 || +x < 0) {
          inputError = "Numbers must be in range [0, 1]";
        }
        tmp.push(+x);
      }
      if (tmp.length > 0)
        profile.push(tmp);
    }

    let m = 0;
    if (profile.length > 0) {
      m = profile[0].length;
      for (let i = 1; i < profile.length; ++i) {
        if (profile[i].length != m) {
          inputError = "Check dimension";
          break;
        }
      }
    }

    if (inputError) {
      this.setState({inputText, inputError});
    } else {
      const n = profile.length;
      this.setState({inputText, inputError, n, m, profile, t: 0});
    }
  }

  handleChangeScheme(event) {
    this.setState({scheme: event.target.value});
  }

  handleChangeT(event) {
    this.setState({t: +event.target.value});
  }

  render() {
    const {n, m, profile, scheme, t} = this.state;
    const phantoms = makePhantoms(scheme, n, t);
    const altHeight = 240;
    const altWidth = 50;
    const altGap = 120 + Math.max(0, n-5) * 17;

    let sum = 0;
    const medians = [];
    for (let i = 0; i < m; ++i) {
      const votes = profile.map(v => v[i]);
      const median = findMedian(votes.concat(phantoms));
      medians.push(median);
      sum += median;
    }

    return (
      <React.Fragment>
        <h4>Phantom Mechanism Visualization</h4>

        <div style={{float: "right"}}>
          <div><b>Preference profile</b></div>
          <div>n = {n}, m = {m}</div>
          <textarea value={this.state.inputText} onChange={this.handleChangeInputText} />
          <div style={{color: "red"}}>{this.state.inputError}</div>
        </div>

        <select value={scheme} onChange={this.handleChangeScheme}>
          <option value="no_phantoms">No Phantoms</option>
          <optgroup label="Fixed phantoms">
            <option value="uniform_phantoms">Uniform Phantoms</option>
            <option value="median">Median</option>
          </optgroup>
          <optgroup label="Moving phantoms">
            <option value="independent_markets">Independent Markets</option>
            <option value="welfare_maximizing">Welfare Maximizing</option>
          </optgroup>
        </select>
        <br /><br />

        <div style={{position: "relative", height: altHeight + 100, display: "inline-block"}}>
          {range(m).map(i => ( // Render each alternative.
            <React.Fragment key={i}>
              <div key={i} className="alternative" style={{left: i * (altWidth + altGap), width: altWidth}}>
                <div className="altBox" style={{height: altHeight}}>
                  {/* Median boxes */}
                  <div className="median" style={{top: (1-medians[i])*altHeight -5 }} />

                  {/* Votes */}
                  {profile.map((vote, j) => (
                    <div key={j} className="vote" style={{top: (1-vote[i])*altHeight}} />
                  ))}

                  {/* Phantoms */}
                  {phantoms.map((phantom, j) => (
                    <div key={j} className="phantom" style={{top: (1-phantom)*altHeight, left: 0, width: altWidth}} />
                  ))}
                </div>
                <br />
                <div style={{position: "absolute", top: altHeight + 20, left: 0, width: 100}}>
                  <b>Median:</b> {formatNumber(medians[i])}
                </div>
              </div>

              {/* Labels */}
              {groupLabels(
                profile.map(v => v[i]).map((x, j) => ({ x: x, i: j, type: 1, label: (<span key={j}>v</span>) })).concat(
                  phantoms.map((x, j) => ({ x: x, i: j, type: 0, label: (<span key={-j - 1} className="alpha">α</span>) }))
                )
              ).map((o, index) => (
                <div className="label" key={index} style={{left: (i + 1) * (altWidth + altGap) - altGap + 7, top: (1-o.x)*altHeight - 12}}>{o.label}</div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div><b>Sum of medians:</b> <span style={sum > 1 ? {backgroundColor: "#faa"} : null}>{formatNumber(sum)}</span></div>

        {(scheme == "independent_markets" || scheme == "welfare_maximizing") &&
          <div>
            <input type="range" min={0} max={1} step={0.005} value={t} onChange={this.handleChangeT} className="slider" /> &nbsp; t = {t}
          </div>
        }

        <div className="reference">
          <p>Each gray bar represents an alternative. "v" represents a voter. "α" represents a phantom. The top and the bottom of each bar represent an allocation of 1 and 0, respectively. The white rectangle indicates the median allocation.</p>
          <p>Reference: Rupert Freeman, David M. Pennock, Dominik Peters, and Jennifer Wortman Vaughan. 2019. Truthful Aggregation of Budget Proposals. In <i>Proceedings of the 2019 ACM Conference on Economics and Computation (EC '19)</i>. ACM, 751-752.</p>
        </div>
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
