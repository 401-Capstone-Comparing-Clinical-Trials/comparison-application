import flask
from flask import request, jsonify
from flask_cors import CORS, cross_origin
import requests
import json
from datetime import datetime

app = flask.Flask(__name__)
app.config["DEBUG"] = True
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
CORS(app, support_credentials=True)

@app.route('/', methods=['POST'])
@cross_origin(supports_credentials=True)
def home():
    return '''
    <h1>Comparison Backend</h1>
    '''

# Send request to clinical api server and then parse it
def get_trials(keyword):
    # Use keyword to query the API
    key = keyword.split()
    search = ""
    last_ind = len(key) - 1

    for i in range(0, len(key)):
        search = search + key[i]
        if i != last_ind:
            search += "+"
    
    # clinical api server can only send 100 trials per request
    query_string = "https://clinicaltrials.gov/api/query/full_studies?expr=" + search + "&min_rnk=1&max_rnk=100&fmt=json"
    response = requests.get(query_string)

    # only extract useful part in JSON
    full_studies_response = response.json()['FullStudiesResponse']
    try:
        full_studies = full_studies_response['FullStudies']
    except KeyError:
        print("No FullStudies Section")
        return None
    
    return full_studies

# First remomve ongoing trials (we only need completed trials) and then sort it
def apply_sorting_criteria(trial_data, criteria):
    remove = set_up_score(trial_data, criteria)
    remove = remove[::-1]
    for i in remove:
        del trial_data[i]
    
    sort_trials(trial_data)

# Sort Trials By Criteria Route
@app.route('/api/sortTrialsByCriteria', methods=['POST'])
def api_sortTrialsByCriteria():
    keyword = request.form['keyword']
    num_results = request.form['numResult']
    if num_results == '':
        num_results = '10'
    
    criteria = parse_request(request)
    trial_data = get_trials(keyword)
    
    # if no result from clinical api server, return False to frontend
    if trial_data == None:
        return jsonify(
            status=False,
            message="Cannot search trials"
        )
    
    apply_sorting_criteria(trial_data, criteria)
    end = int(num_results)
    if len(trial_data) < end:
        end = len(trial_data)
    
    # return number of trials user input
    response = jsonify(
        status=True,
        message="Successfully sorted trials",
        data=trial_data[:end]
    )
    
    #response.headers.add("Access-Control-Allow-Origin", "*")
    return response, 200

# Initial all matching results
def set_criteria_match():
    result = {
        'type':False,
        'allocation':False,
        'age':False,
        'gender':False,
        'condition':False,
        'inclusion':False,
        'exclusion':False,
        'includeDrug':False,
        'excludeDrug':True
    }
    return result

# Sort trials from highest score to lowest
def sort_trials(trial_data):
    def score(trial_data):
        try:
            return int(trial_data['score'])
        except KeyError:
            return float('-inf')
    trial_data.sort(key=score, reverse=True)

# Parse user's input from sorting criteria
def parse_request(request):
    result = {
        'type':request.form['type'],
        'typeWeight':1,
        'allocation':request.form['allocation'],
        'allocationWeight':1,
        'age_start':request.form['age'],
        'age_end':'',
        'ageWeight':1,
        'gender':request.form['gender'],
        'genderWeight':1,
        'condition':request.form['condition'],
        'conditionWeight':1,
        'inclusion':request.form['inclusion'],
        'inclusionWeight':1,
        'exclusion':request.form['exclusion'],
        'exclusionWeight':1,
        'includeDrug':request.form['includeDrug'],
        'includeDrugWeight':1,
        'excludeDrug':request.form['excludeDrug'],
        'excludeDrugWeight':1
    }
    
    result['type']=result['type'].lower()
    result['allocation']=result['allocation'].lower()
    
    # Parse age that allow user input range of age
    try:
        age_list=result['age_start'].split("-")
        
        if len(age_list) == 1:
            result['age_start']=age_list[0].strip()
            result['age_end']=age_list[0].strip()
            
            int_age=int(result['age_start'])
            int_age=int(result['age_end'])
        elif len(age_list) != 2:
            result['age_start']=''
        else:
            result['age_start']=age_list[0].strip()
            result['age_end']=age_list[1].strip()
        
            int_age=int(result['age_start'])
            int_age=int(result['age_end'])
            
            if int(result['age_start']) > int(result['age_end']):
                result['age_start']=''
                result['age_end']=''
    except ValueError:
        result['age_start']=''
        result['age_end']=''
    
    # make all string to case-insensitive
    result['gender']=result['gender'].lower()
    result['condition']=result['condition'].lower()
    result['inclusion']=result['inclusion'].lower()
    result['exclusion']=result['exclusion'].lower()
    result['includeDrug']=result['includeDrug'].lower()
    result['excludeDrug']=result['excludeDrug'].lower()
    
    # Parse sorting criteria weight
    if request.form['typeWeight'] != '':
        result['typeWeight']=int(request.form['typeWeight'])
    if request.form['allocationWeight'] != '':
        result['allocationWeight']=int(request.form['allocationWeight'])
    if request.form['ageWeight'] != '':
        result['ageWeight']=int(request.form['ageWeight'])
    if request.form['genderWeight'] != '':
        result['genderWeight']=int(request.form['genderWeight'])
    if request.form['conditionWeight'] != '':
        result['conditionWeight']=int(request.form['conditionWeight'])
    if request.form['inclusionWeight'] != '':
        result['inclusionWeight']=int(request.form['inclusionWeight'])
    if request.form['exclusionWeight'] != '':
        result['exclusionWeight']=int(request.form['exclusionWeight'])
    if request.form['includeDrugWeight'] != '':
        result['includeDrugWeight']=int(request.form['includeDrugWeight'])
    if request.form['excludeDrugWeight'] != '':
        result['excludeDrugWeight']=int(request.form['excludeDrugWeight'])
    
    return result

# Assign score to all trials
def set_up_score(trial_data, criteria):
    remove = []
    count = 0
    for study in trial_data:
        try:
            protocol_section=study['Study']['ProtocolSection']
        except KeyError:
            print("No Protocol Section")
            continue
            
        score=0
        criteriaMatch=set_criteria_match()
        # First check if trials completed. If not, continue and add the remove list
        try:
            completed_date=protocol_section['StatusModule']['PrimaryCompletionDateStruct']['PrimaryCompletionDate']
            date_list=completed_date.split(' ')
            date_str=''
            if len(date_list)==2:
                date_str += date_list[1] + '-' + date_list[0] + '-01'
            else:
                date_str += date_list[2] + '-' + date_list[0] + '-' + date_list[1][:len(date_list[1])-1]
                
            dt = datetime.strptime(date_str, '%Y-%B-%d')
            now_dt = datetime.now()
            
            if now_dt < dt:
                remove.append(count)
        except KeyError:
            remove.append(count)
            print("No completion date Section")
        
        # StudyType part
        try:
            study_type=protocol_section['DesignModule']['StudyType']
            study_type=study_type.lower()
            if criteria['type'] == study_type:
                score+=criteria['typeWeight']
                criteriaMatch['type']=True
        except KeyError:
            print("No StudyType Section")
        
        # Allocation part
        try:
            design_allocation=protocol_section['DesignModule']['DesignInfo']['DesignAllocation']
            design_allocation=design_allocation.lower()
            if criteria['allocation'] == design_allocation:
                score+=criteria['allocationWeight']
                criteriaMatch['allocation']=True
        except KeyError:
            print("No DesignAllocation Section")
        
        if protocol_section['EligibilityModule']:
            # Age part: parse age range from clinical api
            eligibility_module=protocol_section['EligibilityModule']
            min_age=''
            max_age=''
            try:
                min_age = eligibility_module['MinimumAge']
            except KeyError:
                print("No minimumAge Section")
                
            try:
                max_age = eligibility_module['MaximumAge']
            except KeyError:
                print("No MaximumAge Section")
            
            int_min_age=0
            int_max_age=0
            if min_age != '':
                int_min_age = int(min_age.split(' ')[0])
            if max_age != '':
                int_max_age = int(max_age.split(' ')[0])
            
            # Start checking if age matches request
            if not criteria['age_start'] == '' and not criteria['age_end'] == '':
                int_age_start=int(criteria['age_start'])
                int_age_end=int(criteria['age_end'])
                
                if min_age != '' and max_age != '':
                    if int_age_start>=int_min_age and int_age_end<=int_max_age:
                        score+=criteria['ageWeight']
                        criteriaMatch['age']=True
                elif min_age != '':
                    if int_age_start>=int_min_age:
                        score+=criteria['ageWeight']
                        criteriaMatch['age']=True
                elif max_age != '':
                    if int_age_end<=int_max_age:
                        score+=criteria['ageWeight']
                        criteriaMatch['age']=True
            
            # Gender part
            try:
                gender=eligibility_module['Gender']
                gender=gender.lower()
                if criteria['gender'] == gender:
                    score+=criteria['genderWeight']
                    criteriaMatch['gender']=True
            except KeyError:
                print("No Gender Section")
            
            # Inclusion/Exclusion Criteria part
            try:
                eligibility_criteria=eligibility_module['EligibilityCriteria']
                eligibility_criteria=eligibility_criteria.split('\n')
                eligibility_criteria = filter(None, eligibility_criteria)
                
                in_criteria=False
                ex_criteria=False
                in_list=[]
                ex_list=[]

                for element in eligibility_criteria:
                    if element == 'Inclusion Criteria:':
                        in_criteria=True
                        ex_criteria=False
                        continue
                    elif element == 'Exclusion Criteria:':
                        in_criteria=False
                        ex_criteria=True
                        continue
                    
                    if in_criteria:
                        in_list.append(element.lower())
                    if ex_criteria:
                        ex_list.append(element.lower())
                
                # Check inclusion
                if not criteria['inclusion'] == '':
                    for element in in_list:
                        if criteria['inclusion'] in element:
                            score+=criteria['inclusionWeight']
                            criteriaMatch['inclusion']=True
                            break
                
                # Check exclusion
                if not criteria['exclusion'] == '':
                    for element in ex_list:
                        if criteria['exclusion'] in element:
                            score+=criteria['exclusionWeight']
                            criteriaMatch['exclusion']=True
                            break
            except KeyError:
                print("No EligibilityCriteria Section")
            
        # Condition part
        try:
            con_list=protocol_section['ConditionsModule']['ConditionList']['Condition']
            if not criteria['condition'] == '':
                for condi in con_list:
                    if criteria['condition'] in condi.lower():
                        score+=criteria['conditionWeight']
                        criteriaMatch['condition']=True
                        break
        except KeyError:
            print("No condition Section")
        
        # Treatment part
        try:
            intervention_list=protocol_section['ArmsInterventionsModule']['InterventionList']['Intervention']
            for intervention in intervention_list:
                intervention_type=intervention['InterventionType']
                intervention_type=intervention_type.lower()
                # if intervention_type == 'drug' or intervention_type == 'other':
                
                intervention_name=intervention['InterventionName']
                intervention_name=intervention_name.lower()
                if criteria['includeDrug'] != '' and not criteriaMatch['includeDrug']:
                    if criteria['includeDrug'] in intervention_name:
                        score+=criteria['includeDrugWeight']
                        criteriaMatch['includeDrug']=True
                    
                if criteria['excludeDrug'] != '' and criteriaMatch['excludeDrug']:
                    if criteria['excludeDrug'] in intervention_name:
                        criteriaMatch['excludeDrug']=False
                
        except KeyError:
            print("No includeTreatment and excludeTreatment Section")
            
        if criteria['excludeDrug'] == '':
            criteriaMatch['excludeDrug']=False
        else:
            if criteriaMatch['excludeDrug']:
                score+=criteria['excludeDrugWeight']
            
        study.update({'score':score, 'criteriaMatch':json.dumps(criteriaMatch)})
        count+=1
        
    return remove

app.run(debug=True, host='0.0.0.0')