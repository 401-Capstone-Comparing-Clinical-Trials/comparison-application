import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai"

//This is the main (parent) class. This is the first component to be created.
class Display extends React.Component{
  //Runs only on refresh
  constructor(props){
    super(props);

    //Bind functions 
    this.executeSearch=this.executeSearch.bind(this);
    this.displayTrial = this.displayTrial.bind(this);
    this.showTable = this.showTable.bind(this);

    //Since we want to use these values elsewhere, add them to the state since state is persistent (each componenet instance has own state).
    this.state = {displayInCriteria: false, displayOutCriteria: false, displayOutMeasures: false, displayResults: false, ready: false, table: true, tableButton: false}; 
  }

  //Runs when input form is submitted - takes input form as argument
  executeSearch(formData){
    let weights = [];
    //Store weights from form to use later - weight is 0 if no form input for that category
    //These should probably be stored in key-value format instead of array
    formData.get('type') === '' ? weights.push('0') : weights.push(formData.get('typeWeight'));
    formData.get('allocation') === '' ? weights.push('0') : weights.push(formData.get('allocationWeight'));
    formData.get('age') === '' ? weights.push('0') : weights.push(formData.get('ageWeight'));
    formData.get('gender') === '' ? weights.push('0') : weights.push(formData.get('genderWeight'));
    formData.get('condition') === '' ? weights.push('0') : weights.push(formData.get('conditionWeight'));
    formData.get('inclusion') === '' ? weights.push('0') : weights.push(formData.get('inclusionWeight'));
    formData.get('exclusion') === '' ? weights.push('0') : weights.push(formData.get('exclusionWeight'));
    formData.get('includeDrug') === '' ? weights.push('0') : weights.push(formData.get('includeDrugWeight'));
    formData.get('excludeDrug') === '' ? weights.push('0') : weights.push(formData.get('excludeDrugWeight'));

    let results = []
    //Make call to backend API and send the form data
    fetch('http://127.0.0.1:5000/api/sortTrialsByCriteria', {method: 'POST', body: formData})
      .then(response => response.json())
      .then((result) => {
        //Store every trial returned from backend
        for(let i = 0; i < result.data.length; i++){
          results.push(result.data[i]);
        }
        this.setState({trials: results, numDisplays: result.data.length, ready: true, table: true, weights: weights});
      },
      (error) => {alert(error)});
    return false;

  }

  //Function to display the result table and thus not display the 'show table' button
  showTable(){
    this.setState({table: true, tableButton: false});
  }

  //Displays individual trial identified by it's ranking
  displayTrial(trialRank){
    let i = 0;
    let curTrial;
    for(i; i < this.state.numDisplays; i++){
      //Find relevant trial and create TrialWrapper for it
      if(this.state.trials[i].Rank === trialRank){
        curTrial = <TrialWrapper key={"key"+ i} numDisplays={1} 
        displayInCriteria={this.state.displayInCriteria}
        displayOutCriteria={this.state.displayOutCriteria}
        displayOutMeasures={this.state.displayOutMeasures}
        displayResults={this.state.displayResults}
        toggleInCriteria={()=>this.toggleInCriteria()}
        toggleOutCriteria={() => this.toggleOutCriteria()}
        toggleOutMeasures={() => this.toggleOutMeasures()}
        toggleResults={() => this.toggleResults()}
        trialData={JSON.stringify(this.state.trials[i])}
        />;
        break;
      }
    }
    //Table is no longer being displayed, 'show table' button should now be displayed
    this.setState({curTrial: curTrial, displayRank: trialRank, table: false, tableButton: true});
  }

  //Toggles the relevant dropdown and then calls displayTrial
  toggleInCriteria(){
    this.setState({displayInCriteria: !this.state.displayInCriteria}, () => this.displayTrial(this.state.displayRank));
  }

  toggleOutCriteria(){
    this.setState({displayOutCriteria: !this.state.displayOutCriteria}, () => this.displayTrial(this.state.displayRank));
  }

  toggleOutMeasures(){
    this.setState({displayOutMeasures: !this.state.displayOutMeasures}, () => this.displayTrial(this.state.displayRank));
  }

  toggleResults(){
    this.setState({displayResults: !this.state.displayResults}, () => this.displayTrial(this.state.displayRank));
  }

  //Displays to the screen
  render(){
    return(
      <div className="Background">
        <div className = 'PatientAndTrials'>
          <PatientDisplay className="PatienDisplay" executeSearch={this.executeSearch} showTable={this.showTable} tableButton={this.state.tableButton}/>
          <div className="TrialCollection">
            {this.state.ready ? (this.state.table ? <TableDisplay className="TableDisplay" weights={this.state.weights} data={this.state.trials} displayTrial={this.displayTrial}/> : this.state.curTrial) : null}
          </div>
        </div>
      </div>
    );
  }
}

//Class representing the input form
class PatientDisplay extends React.Component {
  constructor(props){
    super(props);
    this.state = {executeSearch: this.props.executeSearch, tableButton: this.props.tableButton}; //Functions passed from parent
    //Bind functions
    this.handleSubmit = this.handleSubmit.bind(this);
    this.showTable = this.props.showTable.bind(this);

  }

  //Runs when form is submitted
  handleSubmit(event){
    event.preventDefault(); //Prevents refresh of entire page
    let formData = new FormData(event.target); //Gets form input data
    this.state.executeSearch(formData); //calls executeSearch (see parent class)
  }

  //Runs when a prop from the parent changes
  componentDidUpdate(prevProps){
    if(this.props.tableButton != prevProps.tableButton){
      this.setState({tableButton: this.props.tableButton});
    }
  }

  /*REQUEST FORMAT: key/value pairs with HTML form
  keys: 'keyword', 'numResult', 'type', 'typeWeight' 'allocation', 'allocationWeight' 'age', 'ageWeight', 'gender', 'genderWeight',
  'condition', 'conditionWeight', 'inclusion', 'inclusionWeight',
  'exclusion', 'exclusionWeight', 'ongoing', 'includeDrug', 'includeDrugWeight', 'excludeDrug, excludeDrugWeight'
  */

  render(){
    //Set styles as constants to use throughout
    const BarStyling = {width:"85%",background:"#F2F1F9", border:"none", padding:"0.5rem", margin:"5px"};
    const smallerBar = {width:"68%",background:"#F2F1F9", border:"none", padding:"0.5rem", margin:"5px"}
    const WeightStyling = {width:"7%",background:"#F2F1F9", border:"none", padding:"0.5rem", margin:"5px"}
    return(
      <div className='PatientDisplay'>
        <form onSubmit={this.handleSubmit}>
          <p className="Header1">Search Parameters</p>
          <div>
            <input 
            name="keyword"
            style={BarStyling}
            onChange={this.handleKeywordChange}
            placeholder={"Enter Keyword(s) *REQUIRED"}
            />
          </div>
          <div>
            <input 
            name="numResult"
            type="text"
            style={BarStyling}
            placeholder= {"number of results: (default 10)"}
            />
          </div>
          <div>
            <input
            name="type"
            style={smallerBar}
            className="TextInput"
            placeholder="Study Type"
            />
            <input
            name="typeWeight"
            style={WeightStyling}
            placeholder="1-9"
            />
          </div>
          <div>
            <input
            name="allocation"
            style={smallerBar}
            className="TextInput"
            placeholder="Study Allocation"
            />
            <input
            name="allocationWeight"
            style={WeightStyling}
            placeholder="1-9"
            />
          </div>
          <p className="Header1">Patient Information</p>
          <div>
            <input
            name="age"
            style={smallerBar}
            className="TextInput"
            placeholder="Age range x-y"
            />
            <input
            name="ageWeight"
            style={WeightStyling}
            placeholder="1-9"
            />
          </div>
          <div>
            <input
            name="gender"
            style={smallerBar}
            className="TextInput"
            placeholder="Gender"
            />
            <input
            name="genderWeight"
            style={WeightStyling}
            placeholder="1-9"
            />
          </div>
          <div>
            <input
            name="condition"
            style={smallerBar}
            placeholder="Condition"
            />
            <input
            name="conditionWeight"
            placeholder="1-9"
            style={WeightStyling}
            />
          </div>
          <div>
            <input
            name="inclusion"
            style={smallerBar}
            placeholder="Inclusion Criteria"
            />
            <input
            name="inclusionWeight"
            style={WeightStyling}
            placeholder="1-9"
            />
          </div>
          <div>
            <input
            name="exclusion"
            style={smallerBar}
            placeholder="Exlusion Criteria"
            />
            <input
            name="exclusionWeight"
            style={WeightStyling}
            placeholder="1-9"
            />
          </div>
          <div>
            <input
            name="includeDrug"
            placeholder="Include Treatment"
            style={smallerBar}
            />
            <input
            name="includeDrugWeight"
            placeholder="1-9"
            style={WeightStyling}
            />
          </div>
          <div>
            <input
            name="excludeDrug"
            className="TextInput"
            placeholder="Exclude Treatment"
            style={smallerBar}
            />
            <input
            name="excludeDrugWeight"
            placeholder="1-9"
            style={WeightStyling}
            />
          </div>
          <br/>
          <br/>
          <input type='submit' value="Search"/>
        </form>
        {this.state.tableButton ? <button type="button" onClick={this.showTable}>Show table</button> : null}
      </div>
    );
  }
}


//Class to represent the table display
class TableDisplay extends React.Component {

  constructor(props){
    super(props);
    this.createData = this.createData.bind(this);
    this.pickColor = this.pickColor.bind(this);
    this.displayTrial = this.props.displayTrial.bind(this);
    this.scoreRow = this.scoreRow.bind(this);
    this.nameRow = this.nameRow.bind(this);
    this.typeRow = this.typeRow.bind(this);
    this.allocationRow = this.allocationRow.bind(this);
    this.ageRow = this.ageRow.bind(this);
    this.genderRow = this.genderRow.bind(this);
    this.conditionRow = this.conditionRow.bind(this);
    this.inclusionRow = this.inclusionRow.bind(this);
    this.exclusionRow = this.exclusionRow.bind(this);
    this.includeDrugRow = this.includeDrugRow.bind(this);
    this.excludeDrugRow = this.excludeDrugRow.bind(this);
    this.state = {trials: this.props.data, weights: this.props.weights};

  }

  //Creates a table row for scores of all trials
  scoreRow(trials){
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(<td key={'score' + i} onClick={() => this.displayTrial(trials[i].rank)}>{trials[i].score}</td>);
    }
    return result;
  }

  //Creates a table row for names of all trials
  nameRow(trials){
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'name' + i} onClick={() => this.displayTrial(trials[i].rank)}>
          <div className="TableNameText">
            {trials[i].name}
          </div>
        </td>
        );
    }
    return result;
  }

  //Creates a table row for type of all trials
  typeRow(trials){
    let score;
    this.state.weights[0] ? score = this.state.weights[0] : score = '1'; //Set default score to 1 if none given
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'type' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].type, 0)}}>
          {trials[i].type ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for allocation of all trials
  allocationRow(trials){
    let score;
    this.state.weights[1] ? score = this.state.weights[1] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'allocation' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].allocation, 1)}}>
          {trials[i].allocation ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for age of all trials
  ageRow(trials){
    let score;
    this.state.weights[2] ? score = this.state.weights[2] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'age' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].age, 2)}}>
          {trials[i].age ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for gender of all trials
  genderRow(trials){
    let score;
    this.state.weights[3] ? score = this.state.weights[3] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'gender' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].gender, 3)}}>
          {trials[i].gender ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for condition of all trials
  conditionRow(trials){
    let score;
    this.state.weights[4] ? score = this.state.weights[4] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'condition' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].condition, 4)}}>
          {trials[i].condition ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for inclusion criteria of all trials
  inclusionRow(trials){
    let score;
    this.state.weights[5] ? score = this.state.weights[5] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'inclusion' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].inclusion, 5)}}>
          {trials[i].inclusion ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for exclusion criteria of all trials
  exclusionRow(trials){
    let score;
    this.state.weights[6] ? score = this.state.weights[6] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'exclusion' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].exclusion, 6)}}>
          {trials[i].exclusion ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table row for including treatments of all trials
  includeDrugRow(trials){
    let score;
    this.state.weights[7] ? score = this.state.weights[7] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'includeDrug' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].includeDrug, 7)}}>
          {trials[i].includeDrug ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Creates a table for excluding treatments of all trials
  excludeDrugRow(trials){
    let score;
    this.state.weights[8] ? score = this.state.weights[8] : score = '1';
    let result = [];
    for(let i = 0; i < trials.length; i++){
      result.push(
        <td key={'excludeDrug' + i} onClick={() => this.displayTrial(trials[i].rank)} style={{backgroundColor: this.pickColor(trials[i].excludeDrug, 8)}}>
          {trials[i].excludeDrug ? "Match (+ " + score + " to score)" : "No (+ 0 to score)"}
        </td>);
    }
    return result;
  }

  //Takes an individual trial and returns an object that stores the trial name, rank, and score, and whether each criteria matches or not 
  createData(trial) {
    let score = trial.score;
    let rank = trial.Rank;
    let criteriaMatch = JSON.parse(trial.criteriaMatch);
    let type = criteriaMatch.type;
    let allocation = criteriaMatch.allocation;
    let age = criteriaMatch.age;
    let gender = criteriaMatch.gender;
    let condition = criteriaMatch.condition;
    let inclusion = criteriaMatch.inclusion;
    let exclusion = criteriaMatch.exclusion;
    let includeDrug = criteriaMatch.includeDrug;
    let excludeDrug = criteriaMatch.excludeDrug;

    let name = trial.Study.ProtocolSection.IdentificationModule.BriefTitle;

    return {score, rank, type, allocation, age, gender, name, condition, inclusion, exclusion, includeDrug, excludeDrug};
  }

  //Update component when props from parent changes
  componentDidUpdate(prevProps){
    if(this.props.data != prevProps.data){
      this.setState({trials: this.props.data, weights: this.props.weights});
    }
  }

  //Takes true or false for 'match', and the relevant category index for 'index'
  //Returns the appropriate color based on whther the category matches and what the weight is
  pickColor(match, index){
    let weight = this.state.weights[index];
    if(weight === ''){
      weight = '1';
    }
    if(weight === '0'){
      return '#8a867d';
    }
    if(weight === '1'){
      return (match ? '#bff2c5' : '#e09c90');
    }
    else if(weight === '2'){
      return (match ? '#b1f2b9' : '#de8b7c');
    }
    else if(weight === '3'){
      return (match ? '#a1f0aa' : '#de7e6d');
    }
    else if(weight ==='4'){
      return (match ? '#91ed9b' : '#db715e');
    }
    else if(weight === '5'){
      return (match ? '#7de889' : '#db6651');
    }
    else if(weight === '6'){
      return (match ?'#5de36c' : '#d95841');
    }
    else if(weight === '7'){
      return (match ? '#43de54' : '#d64c33');
    }
    else if(weight === '8'){
      return (match ? '#27db3b' : '#d63518');
    }
    else if(weight === '9'){
      return (match ? '#0fd124' : '#d12202');
    }
    return 'white';
  }
  
  render(){
    const trials = [];
    let i;
    //Create data needed for table creation
    for(i = 0; i < this.state.trials.length; i++){
      trials.push(this.createData(this.state.trials[i]));
    }

    return(
      <div className="MyTableContainer">
        <table className = "MyTableBody">
          <tbody>
            <tr key='Score'>
              <th>
                <div className="TitleCol">
                  Score (sum of matches x weight)
                </div>
              </th>
              {this.scoreRow(trials)}
            </tr>
            <tr key='name'>
              <th>Trial Name</th>
              {this.nameRow(trials)}
            </tr>
            <tr key='type'>
              <th>Type</th>
              {this.typeRow(trials)}
            </tr>
            <tr key='allocation'>
              <th>Allocation</th>
              {this.allocationRow(trials)}
            </tr>
            <tr key='age'>
              <th>Age</th>
              {this.ageRow(trials)}
            </tr>
            <tr key='gender'>
              <th>Gender</th>
              {this.genderRow(trials)}
            </tr>
            <tr key='condition'>
              <th>Condition</th>
              {this.conditionRow(trials)}
            </tr>
            <tr key='inclusion'>
              <th>Inclusion</th>
              {this.inclusionRow(trials)}
            </tr>
            <tr key='exclusion'>
              <th>Exclusion</th>
              {this.exclusionRow(trials)}
            </tr>
            <tr key='includeDrug'>
              <th>Include Treatment</th>
              {this.includeDrugRow(trials)}
            </tr>
            <tr key='excludeDrug'>
              <th>Exclude Treatment</th>
              {this.excludeDrugRow(trials)}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

}

//This class represents an individual clinical trial
class TrialWrapper extends React.Component {
  //Runs on refresh
  constructor(props){
    super(props);
    this.state = {
      displayInCriteria: this.props.displayInCriteria,
      displayOutCriteria: this.props.displayOutCriteria,
      displayOutMeasures: this.props.displayOutMeasures,
      displayResults: this.props.displayResults,
      trialData: JSON.parse(this.props.trialData)
    };
  }

  //Runs when a prop passed down from the parent changes. Used to trigger re-rendering on dropdown toggle
  componentDidUpdate(prevProps) {
    if(this.props.displayInCriteria !==prevProps.displayInCriteria){
      this.setState({displayInCriteria: this.props.displayInCriteria});  
    }
    if(this.props.displayOutCriteria !== prevProps.displayOutCriteria){
      this.setState({displayOutCriteria: this.props.displayOutCriteria});
    }
    if(this.props.displayOutMeasures !== prevProps.displayOutMeasures){
      this.setState({displayOutMeasures: this.props.displayOutMeasures});
    }
    if(this.props.displayResults !== prevProps.displayResults){
      this.setState({displayResults: this.props.displayResults});
    }
    if(this.props.trialData !== prevProps.trialData){
      this.setState({trialData: JSON.parse(this.props.trialData)});
    }
  }

  parseTreatments(data) {
    var treatments = [];
    for(var i = 0; i < data.length; i++) {
      treatments.push(data[i].InterventionType + ": " + data[i].InterventionName);
    }
    return treatments;
  }

  //For criteria, we pass down the current state of dropdowns and the toggle function that we got from the parent
  //For each individual component we create, pass in the relevant part of the trial or null if it does not exist
  render() {
    return (
      <div className="TrialWrapper">
        <TrialName 
          data={this.state.trialData.Study.ProtocolSection.IdentificationModule.BriefTitle? 
            JSON.stringify(this.state.trialData.Study.ProtocolSection.IdentificationModule.BriefTitle) : null} />
        <TrialDate 
          data={this.state.trialData.Study.ProtocolSection.StatusModule? 
            this.state.trialData.Study.ProtocolSection.StatusModule : null}
        />
        <TrialType
          data={this.state.trialData.Study.ProtocolSection.DesignModule ? 
            this.state.trialData.Study.ProtocolSection.DesignModule : null}
        />
        <TrialCondition 
          data={this.state.trialData.Study.ProtocolSection.ConditionsModule.ConditionList.Condition ? 
            this.state.trialData.Study.ProtocolSection.ConditionsModule.ConditionList.Condition : null}
        />
        <TrialTreatment
          treatmentsList={this.state.trialData.Study.ProtocolSection.ArmsInterventionsModule.hasOwnProperty('InterventionList') ? 
            this.parseTreatments(this.state.trialData.Study.ProtocolSection.ArmsInterventionsModule.InterventionList.Intervention) : null}
        />
        <TrialInCriteria 
         displayInCriteria={this.state.displayInCriteria} 
         toggleInCriteria={() => this.props.toggleInCriteria()}
         inclusionStr = {this.state.trialData.Study.ProtocolSection.EligibilityModule.EligibilityCriteria ? 
          this.state.trialData.Study.ProtocolSection.EligibilityModule.EligibilityCriteria : null}
        />
        <TrialExCriteria 
         displayOutCriteria={this.state.displayOutCriteria} 
         toggleOutCriteria={() => this.props.toggleOutCriteria()}
         exclusionStr = {this.state.trialData.Study.ProtocolSection.EligibilityModule.EligibilityCriteria ? 
          this.state.trialData.Study.ProtocolSection.EligibilityModule.EligibilityCriteria : null}
        />
        <TrialOutcomeMeasures 
          displayOutMeasures={this.state.displayOutMeasures} 
          toggleOutMeasures={() => this.props.toggleOutMeasures()}
          data={this.state.trialData.Study.ProtocolSection.OutcomesModule ? 
            JSON.stringify(this.state.trialData.Study.ProtocolSection.OutcomesModule) : null}
        /> 
        <TrialResult
          displayResults={this.state.displayResults} 
          toggleResults={() => this.props.toggleResults()}
          data={this.state.trialData.Study.hasOwnProperty('ResultsSection') ? 
            this.state.trialData.Study.ResultsSection : null}
        />
        <TrialLink
          link={this.state.trialData ? "https://clinicaltrials.gov/ct2/show/study/" + this.state.trialData.Study.ProtocolSection.IdentificationModule.NCTId : null}
        />
      </div>
    );
  }
}

//Represents the trial name for individual trial in display mode
class TrialName extends React.Component {
  constructor(props){
    super(props);
    this.state= {data: this.props.data}
  }

  componentDidUpdate(prevProps){
    if(this.props.data !== prevProps.data){
      this.setState({data: this.props.data});
    }
  }

  render(){
    return(
      <div className="TrialSection" >
        <p>Clinical Trials:</p>
        <div className="text">
            {this.state.data}
        </div>
      </div>
    );
  }
}

//Represents trial date for display
class TrialDate extends React.Component {
  constructor(props){
    super(props);
    let data = this.props.data;
    let start;
    let primary;
    let estComp;
    if(!data.hasOwnProperty('PrimaryCompletionDateStruct')){
      primary = 'n/a';
    }
    else{
      primary = data.PrimaryCompletionDateStruct.PrimaryCompletionDate;
    }
    if(!data.hasOwnProperty('CompletionDateStruct')){
      estComp = 'n/a';
    }
    else{
      estComp = data.CompletionDateStruct.CompletionDate;
    }
    this.state= {
      start: this.props.data.StartDateStruct.StartDate,
      primary: primary,
      estComp: estComp
    };
  }

  render(){
    return(
      <div className="TrialSection" >
        <p>Actual Study Start Date:
          <span className="text">
            {" " + this.state.start}
          </span>
        </p>
        <p>Actual Primary Completion Date:
          <span className="text">
            {" " + this.state.primary}
          </span>
        </p>
        <p>Estimated Study Completion Date:
          <span className="text">
            {" " + this.state.estComp}
          </span>
        </p>
      </div>
    );
  }
}

//Represents the trial type and allocation for display
class TrialType extends React.Component {
  constructor(props){
    super(props);
    this.state = {data: this.props.data}
  }

  componentDidUpdate(prevProps){
    if(this.props.data !== prevProps.data){
      this.setState({data: this.props.data});
    }
  }

  render(){
    return(
      <div className="TrialSection" >
        <p>Type of Trial: 
          <span className="text">
            {" " + this.state.data.StudyType}
          </span>
        </p>
        <p>Allocation: 
          <span className="text">
            {this.state.data.DesignInfo.DesignAllocation ? " " + this.state.data.DesignInfo.DesignAllocation : " N/A"}
          </span>
        </p>
      </div>
    );
  }
}

//Represents the trial condition for display
class TrialCondition extends React.Component {
  constructor(props){
    super(props);
    this.state = {data: this.props.data}
  }

  componentDidUpdate(prevProps){
    if(this.props.data !== prevProps.data){
      this.setState({data: this.props.data});
    }
  }

  render(){
    return(
      <div className="TrialSection" >
        <p>Condition: 
          <span className="text">
            {" " + this.state.data}
          </span>
        </p>
      </div>
    );
  }
}

//Represents the trial treatment for display
class TrialTreatment extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      treatmentsList: this.props.treatmentsList ? this.props.treatmentsList : []
    };
  }

  componentDidUpdate(prevProps) {
    if(this.props !== prevProps) {
      this.setState( {
        treatmentsList: this.props.treatmentsList ? this.props.treatmentsList : []
      });
    }
  }


  render(){
    return(
      <div className="TrialSection" >
        <div>Treatments:
          <span className="text">
            <ul>
              {
                this.state.treatmentsList.map((listitem, i) => (
                  <li key={i}>
                    {listitem}
                  </li>
                ))
              }
            </ul>
          </span>
        </div>
      </div>
    );
  }
}

//Wrapper for inclusion criteria component
class TrialInCriteria extends React.Component {
  constructor(props){
    super(props);
    this.state = {displayInCriteria: this.props.displayInCriteria, inclusionStr: this.props.inclusionStr}
  }

  //Triggers when prop from parent changes (dropdown toggle)
  componentDidUpdate(prevProps){
    if(this.props !== prevProps){
      this.setState({inclusionStr: this.props.inclusionStr});
    }
    if(prevProps.displayInCriteria !== this.props.displayInCriteria){
      this.setState({displayInCriteria: this.props.displayInCriteria});
    }
  }

  //On click, this component calls toggleInCriteria(), the function defined in the Display component
  //This triggers the inclusion dropdown of all trial displays to either appear or disappear
  render(){
    return(
      <div className="TrialSection" onClick={() => this.props.toggleInCriteria()} >
        <p>
          Inclusion Criteria 
          {this.state.displayInCriteria ? <AiFillCaretUp /> : <AiFillCaretDown />}
        </p>
        {this.state.displayInCriteria ? <CriteriaBox type="Inclusion" data={this.state.inclusionStr}/> : null}
      </div>
    );
  }
}

//Same but for exlusion 
class TrialExCriteria extends React.Component {
  constructor(props){
    super(props);
    this.state = {displayOutCriteria: this.props.displayOutCriteria, exclusionStr: this.props.exclusionStr}
  }

  componentDidUpdate(prevProps){
    if(this.props !== prevProps){
      this.setState({exclusionStr: this.props.exclusionStr});
    }
    if(prevProps.displayOutCriteria !== this.props.displayOutCriteria){
      this.setState({displayOutCriteria: this.props.displayOutCriteria});
    }
  }

  render(){
    return(
      <div className="TrialSection" onClick={() => this.props.toggleOutCriteria()} >
        <p>
          Exclusion Criteria 
          {this.state.displayOutCriteria ? <AiFillCaretUp /> : <AiFillCaretDown />}
        </p>
        {this.state.displayOutCriteria ? <CriteriaBox type="Exclusion" data={this.state.exclusionStr}/> : null}
      </div>
    );
  }
}

//Represents the outcome measures for display
class TrialOutcomeMeasures extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      displayOutMeasures: this.props.displayOutMeasures, 
      data: JSON.parse(this.props.data)
    };
  }

  componentDidUpdate(prevProps){
    if(prevProps.displayOutMeasures !== this.props.displayOutMeasures){
      this.setState({displayOutMeasures: this.props.displayOutMeasures});
    }
    if(prevProps.data !== this.props.data){
      this.setState({data: JSON.parse(this.props.data)});
    }
  }

  render(){
    return(
      <div className="TrialSection" onClick={() => this.props.toggleOutMeasures()}>
        <p>
          Outcome Measures
          {this.state.displayOutMeasures ? <AiFillCaretUp /> : <AiFillCaretDown />}
        </p>
        {this.state.displayOutMeasures ? <MeasuresBox data={JSON.stringify(this.state.data)}/> : null}
      </div>
    );
  }
}

//Represents the trial results for display - This section needs more work
class TrialResult extends React.Component {
  constructor(props){
    super(props);
    this.state = {displayResults: this.props.displayResults, 
      data: this.props.data
    };
  }

  componentDidUpdate(prevProps){
    if(prevProps.displayResults !== this.props.displayResults){
      this.setState({displayResults: this.props.displayResults});
    }

    if(this.props !== prevProps){
      this.setState({
        data: this.props.data
      });
    }
  }

  render(){
    return(
      <div className="TrialSection" onClick={() => this.props.toggleResults()}>
        <p>
          Result
          {this.state.displayResults ? <AiFillCaretUp /> : <AiFillCaretDown />}
        </p>
        {this.state.displayResults ? <ResultTable data={this.state.data}/> : null}
      </div>
    );
  }
}

//Represents the trial link for display
class TrialLink extends React.Component {
  constructor(props){
    super(props);
    this.state= {link: this.props.link}
  }

  componentDidUpdate(prevProps){
    if(this.props.link !== prevProps.link){
      this.setState({link: this.props.link});
    }
  }

  render(){
    return(
      <div className="TrialSection" >
        <p>Link: 
          <span className="Link">
            <a href={this.state.link}>{this.state.link}</a>
          </span>
        </p>
      </div>
    );
  }
}

//This component represents a single exclusion or inclusion criteria
class SingleCriteria extends React.Component {
  constructor(props){
    super(props);
    this.state = {criteria: this.props.criteria}
  }

  render(){
    return(
      <div className="Criteria" >
        <p> {this.state.criteria}</p>
      </div>
    );
  }
}

function inclusion(str) {
  let si = str.indexOf("Inclusion Criteria:") + 1
  let ei = str.indexOf("Exclusion Criteria:")
  let newStr = str.slice(si, ei);
  let ans = []

  for (let i = 0; i < newStr.length; i++){
    if (newStr[i] != "") {
      ans.push(newStr[i])
    }
  }

  return ans
}

function exclusion(str) {
  let si = str.indexOf("Exclusion Criteria:") + 1
  let ei = str.length
  let newStr = str.slice(si, ei);
  let ans = []

  for (let i = 0; i < newStr.length; i++){
    if (newStr[i] != "") {
      ans.push(newStr[i])
    }
  }

  return ans
}

//Represents a single result
class IndividualResult extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      title: this.props.data.FlowGroupTitle,
      description: this.props.data.FlowGroupDescription
    };
  }

  render(){
    return(
      <div className='IndividualResult'>
        <p className='Header2'>{this.state.title}</p>
        {this.state.description}
      </div>
    );
  }

}

//Represents table of results for table
class ResultTable extends React.Component {
  constructor(props){
    super(props);
    let results = [];
    let found = true;
    if(!this.props.data){
      this.state = {results: results};
      return;
    }
    if(!this.props.data.hasOwnProperty('ParticipantFlowModule')){
      found = false;
    }
    else if(!this.props.data.ParticipantFlowModule.hasOwnProperty('FlowGroupList')){
      found = false;
    }
    if(found){
      let groups = this.props.data.ParticipantFlowModule.FlowGroupList.FlowGroup;
      for(let i = 0; i < groups.length; i++){
        results.push(<IndividualResult data={groups[i]} key={'result'+ i}/>);
      }
    }
    this.state = { 
      results: results
    }
  }

  render(){
    return(
      <div>
        {this.state.results}
      </div>
    );
  }
}

//Represents container for outcome measure for display
class MeasuresBox extends React.Component {
  constructor(props){
    super(props);
    let numPrimary;
    if(!JSON.parse(this.props.data).hasOwnProperty('PrimaryOutcomeList')){
      numPrimary = 0;
    }else if(!JSON.parse(this.props.data).PrimaryOutcomeList.hasOwnProperty('PrimaryOutcome')){
      numPrimary = 0;
    }
    else{
      numPrimary = JSON.parse(this.props.data).PrimaryOutcomeList.PrimaryOutcome.length;
    }
    let numSecondary;
    if(!JSON.parse(this.props.data).hasOwnProperty('SecondaryOutcomeList')){
      numSecondary = 0;
    }else if(!JSON.parse(this.props.data).SecondaryOutcomeList.hasOwnProperty('SecondaryOutcome')){
      numSecondary = 0;
    }else{
      numSecondary = JSON.parse(this.props.data).SecondaryOutcomeList.SecondaryOutcome.length;
    }
    let primaryOutcomes = [];
    let secondaryOutcomes = [];
    for(let i = 0; i < numPrimary; i++){
      primaryOutcomes.push(
        <IndividualMeasure key={"measure" + i}
        data={JSON.stringify(JSON.parse(this.props.data).PrimaryOutcomeList.PrimaryOutcome[i])}
        type="primary"
        />
      );

    }
    for(let i = 0; i < numSecondary; i++){
      secondaryOutcomes.push(
        <IndividualMeasure key={"measure" + i}
        data={JSON.stringify(JSON.parse(this.props.data).SecondaryOutcomeList.SecondaryOutcome[i])}
        type="secondary"
        />
  
      );
    }
    this.state = { 
      outcomeChoice: props.outcomeChoice, 
      data: JSON.parse(this.props.data),
      numPrimary: numPrimary,
      numSecondary: numSecondary,
      primaryOutcomes: primaryOutcomes,
      secondaryOutcomes: secondaryOutcomes
    }

  }

  render(){
    return(
      <div className="MeasureBox">
        <p className="OutcomeTitle">Primary Outcome Measures</p>
        {this.state.primaryOutcomes}
        <p className="OutcomeTitle">Secondary Outcome Measures</p>
        {this.state.secondaryOutcomes}
      </div>
    );
  }
    
}

//Represents a single outcome measure for display
class IndividualMeasure extends React.Component {
  constructor(props){
    super(props);
    if(this.props.type === "primary"){
      this.state = {
        Measure: JSON.parse(this.props.data).PrimaryOutcomeMeasure,
        Description: JSON.parse(this.props.data).PrimaryOutcomeDescription,
        TimeFrame: JSON.parse(this.props.data).PrimaryOutcomeTimeFrame
      };
    }
    else if(this.props.type === "secondary"){
      this.state = {
        Measure: JSON.parse(this.props.data).SecondaryOutcomeMeasure,
        Description: JSON.parse(this.props.data).SecondaryOutcomeDescription,
        TimeFrame: JSON.parse(this.props.data).SecondaryOutcomeTimeFrame
      }
    }
    
  }

  render(){
    return(
      <div className="IndividualMeasure">
        <p>Outcome Measure: {this.state.Measure}</p>
        <p>Description: {this.state.Description}</p>
        <p>Time Frame: {this.state.TimeFrame}</p>
      </div>
    );
  }
}

//Contains one type (inclusion or exclusion) of criteria for one trial display
class CriteriaBox extends React.Component {
  constructor(props){
    super(props);
    let str;
    if(this.props.type === "Inclusion"){
      this.state = {
        type: this.props.type,
        criteria: this.props.data.split("Exclusion Criteria:")[0].split("\n")
      };
    }
    else{
      if(this.props.data.split("Exclusion Criteria:").length < 2){
        this.state = {type: this.props.type, criteria: []}
        return;
      }
      this.state = {
        type: this.props.type,
        criteria: this.props.data.split("Exclusion Criteria:")[1].split("\n")
      };
    }


    
  }
  render(){
    let i;
    const allCriteria = [];
    for (i = 0; i < this.state.criteria.length; i++) { 
      if(this.state.criteria[i] !== "Inclusion Criteria:" && this.state.criteria[i] !== ""){
        allCriteria.push(<SingleCriteria criteria={this.state.criteria[i]} type={this.state.type} key={"criteria" + i}/>);
      }     
    }
    return(
      <div className="CriteriaBox" >
        {allCriteria}
      </div>
    );
  }
}


// ========================================

//This is the root which triggers the parent component (Display) to run
ReactDOM.render(
  <Display />, //Triggers main component to display
  document.getElementById('root')
);

