import { LightningElement,wire,api, track } from 'lwc';
import noHeader from '@salesforce/resourceUrl/NoHeader';
import {loadStyle} from "lightning/platformResourceLoader";
import getUserDetails from '@salesforce/apex/Timesheet.getUserDetails';
import getTimesheet from '@salesforce/apex/Timesheet.getTimesheet';
import createTasksPerDay from '@salesforce/apex/Timesheet.createTasksPerDay';
import searchActions from '@salesforce/apex/Timesheet.searchActions';
import getTasks from '@salesforce/apex/Timesheet.getTasks';
import deleteTimesheetTask from '@salesforce/apex/Timesheet.deleteTimesheetTask';
import updatedTimesheet from '@salesforce/apex/Timesheet.updatedTimesheet';
import updateHoursCount from '@salesforce/apex/Timesheet.updateHoursCount';
import updateTimesheetStatus from '@salesforce/apex/Timesheet.updateTimesheetStatus';
import updateLeaveInDayTimeEntry from '@salesforce/apex/Timesheet.updateLeaveInDayTimeEntry';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
export default class Timesheet extends NavigationMixin(LightningElement) {
    @track resourceId;
    @track resourceName;
    @track resourceRole;
    @track selectedDate;
    @track displayweekStartDate;
    @track monDate;
    @track tueDate;
    @track wedDate;
    @track thurDate;
    @track friDate;
    @track satDate;
    @track sunDate;
    @track tasksPerDay;
    @track tasks;
    @track dayTimeEntry;
    @track taskToDisplay=[];
    timesheetResult;
    @track selectedTaskId;
    @track selectedProjectId;
    @track isSubmitted = false;
    @track leaveForm=false;
    @track showTimesheet=true;
    @track taskOptions=[];
    @track leaveDay;
    @track leaveDate;
    searchKeyword='';
    actions = [];
    filteredActions = [];
    @track leaves={
      Monday:false,
      Tuesday:false,
      Wednesday:false,
      Thursday:false,
      Friday:false,
      Saturday:true,
      Sunday:true
    }
    @track relatedTasks;
    @track timesheetResult;
    connectedCallback() {
        loadStyle(this, noHeader)
            .then(result => {});
    }
    showLeaveForm()
    {
      console.log('Leave');
      this.leaveForm=true;
      this.showTimesheet=false;
    }
    handleLeaveClick()
    {
        console.log('leaveDate '+this.leaveDate+' leaveDay '+this.leaveDay);
        updateLeaveInDayTimeEntry({leaveDate:this.leaveDate,leaveDay:this.leaveDay})
        this.showToast('success', 'Leave is applied', 'success');
        this.leaveForm=false;
        this.showTimesheet=true;
    }
    handleDayChange(event)
    {
        this.leaveDay=event.target.value;
        console.log('leaveDay '+this.leaveDay);
    }
    handleDateChange(event)
    {
        this.leaveDate=event.target.value;
        console.log('leaveDate '+this.leaveDate);
    }  
    /*@wire(getTimesheet)
    timesheet(result) {
      this.timesheetResult = result;
      const { data, error } = result;
        if (data) {
            this.taskToDisplay = data;
        } else if (error) {
            console.error(error);
        }
    }*/
    @wire(getTimesheet, { selectedTaskId: '$selectedTaskId', userId: '$resourceId', weekStartDate: '$weekStartDate', weekEndDate: '$weekEndDate', selectedDate: '$selectedDate', selectedDay: '$selectedDayName' })
    timesheetResult({error,data})
    {
      if(data)
      {
        for(let key in data){
          this.taskToDisplay.push({value:data[key],key:key});
        }
      }
      else{
        window.console.log(error);
      }
    }
    /*refreshTimesheetData() {
    refreshApex(this.timesheetResult)
    .then((result) => {
      console.log('Timesheet data refreshed'+this.timesheetResult);
    })
    .catch(error => {
      console.error('Error refreshing timesheet data:', error);
    });
}*/

    handleResourceChange(event){
        this.resourceId=event.target.value;
        console.log('Selected User Id:', this.resourceId);
        getUserDetails({userId:this.resourceId})
        .then(result=>{
            this.resourceName = result.Name;
            this.resourceRole = result.Title;
            console.log('Selected User Name:',this.resourceName);
            console.log('Selected User Title:',this.resourceRole);
        })
        .catch(error=>{
            console.error(error);
        });
    }
    handleInputDateChange(event) {
        this.selectedDate = new Date(event.target.value);
        console.log(this.selectedDate);
    }
    handleGoClick()
    {
        const dayOfWeek = this.selectedDate.getDay();
        console.log(dayOfWeek);
        const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const selectedDayName = weekdays[dayOfWeek];
        console.log(selectedDayName);
        const weekStartDate = new Date(this.selectedDate);
        weekStartDate.setDate(this.selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        console.log(weekStartDate);
        const weekEndDate = new Date(this.selectedDate);
        weekEndDate.setDate(this.selectedDate.getDate() + (7 - this.selectedDate.getDay()));
        console.log(weekEndDate);
        this.weekStartDate = weekStartDate.toISOString().slice(0, 10);
        this.weekEndDate = weekEndDate.toISOString().slice(0, 10);
        console.log(this.weekStartDate);
        console.log(this.weekEndDate);
        console.log('Go click');
        const dates=[];
        for(let i=0;i<7;i++)
        {
            const date=new Date(weekStartDate);
            date.setDate(date.getDate()+i);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            dates.push(formattedDate);
        }
        this.monDate=`${dates[0]}`;
        this.tueDate=`${dates[1]}`;
        this.wedDate=`${dates[2]}`;
        this.thurDate=`${dates[3]}`;
        this.friDate=`${dates[4]}`;
        this.satDate=`${dates[5]}`;
        this.sunDate=`${dates[6]}`;
        console.log(this.monDate);
        this.displayweekStartDate=this.weekStartDate;
        getTimesheet({ selectedTaskId: this.selectedTaskId, userId: this.resourceId, weekStartDate: this.weekStartDate, weekEndDate: this.weekEndDate, selectedDate: this.selectedDate, selectedDay: selectedDayName })
        .then(result=>{
            console.log(weekStartDate);
            console.log(weekEndDate);
            console.log(result);
            this.dayTimeEntry=result.dayTimeEntry;
            //this.taskToDisplay=result.taskToDisplay;
            console.log('taskToDisplay'+ this.taskToDisplay);
            this.leaves.Monday = this.dayTimeEntry[0].Leave__c;
            this.leaves.Tuesday = this.dayTimeEntry[1].Leave__c;
            this.leaves.Wednesday = this.dayTimeEntry[2].Leave__c;
            this.leaves.Thursday = this.dayTimeEntry[3].Leave__c;
            this.leaves.Friday = this.dayTimeEntry[4].Leave__c;
            this.leaves.Saturday = this.dayTimeEntry[5].Leave__c;
            this.leaves.Sunday = this.dayTimeEntry[6].Leave__c;
            this.taskToDisplay = result.taskToDisplay;
            this.tasksPerDay =result.tasksPerDay;
            this.refreshTimesheetData();
        })
        .catch(error=>{
            console.error(error);
        });
    }
    handleProjectClick(event)
    {
        console.log('Success');
        const projectId = event.target.dataset.projectId;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: projectId,
                actionName: 'view'
            }
        });
    }
    handleTaskClick(event)
    {
        console.log('Success');
        const taskId = event.target.dataset.taskId;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: taskId,
                actionName: 'view'
            }
        });
    }
    
    handleTimesheetData(taskId, day, hoursWorked) {
      console.log('Save Timesheet Click '+' day '+day+' taskId '+taskId);
        /*if(this.isSubmitted===true)
        {
        this.showToast('Error', 'Timesheet is already submitted. It cannot be edited.', 'error');
        return;
        }*/
        const tasksPerDayData = []; 
        this.tasksPerDay.forEach((taskPerDay) => {
          const existingTask = taskPerDay.ExistingTask;  //avoid adding existing Tasks_Per_Day__c 
          console.log('existingTask '+existingTask);
          const taskData = {
            sobjectType: 'Tasks_Per_Day__c',
            Task__c: taskPerDay.Action__c,
            Day_Time_Entry__c: this.dayTimeEntry.Id,
            Project__c: taskPerDay.Project__c
          };
          console.log('taskData '+taskData);          
          if (existingTask) {
            taskData.Id = existingTask.Id;
          }
          tasksPerDayData.push(taskData);       //Store new Tasks_Per_Day__c records
        }); 
        const tasksPerDayRecords = [];
        const weekdays = ['SUN','MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dates = [];
        const startDate = new Date(this.weekStartDate);
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          dates.push(date);
        }
        tasksPerDayData.forEach((taskData) => {
          //let totalhoursCount = 0;
          
            console.log('taskId ' + taskId);
            dates.forEach((date) => {
              const dayTaskData = { ...taskData };
              dayTaskData.Day_Date__c = date.toISOString().slice(0, 10);
              const dayOfWeek = weekdays[date.getDay()];
              if (dayOfWeek === day&&taskData.Task__c === taskId) {
                dayTaskData.Hours_Worked__c =hoursWorked;
              }
              //totalhoursCount += dayTaskData.Hours_Worked__c || 0;
              tasksPerDayRecords.push(dayTaskData);
            });
            //console.log('taskId ' + taskId + ' hours Count: ' + totalhoursCount);
          
        });  
        console.log('success');
        console.log(this.weekStartDate);
        console.table(tasksPerDayRecords);
        createTasksPerDay({ tasksPerDayData: tasksPerDayRecords,userId:this.resourceId,weekStartDate:this.weekStartDate,weekEndDate:this.weekEndDate})
          .then((result) => {
            console.log('createTasksPerDay '+result);
            this.handleGoClick();
            updateHoursCount({taskId,userId:this.resourceId,weekStartDate:this.weekStartDate,weekEndDate:this.weekEndDate})
          .then((result) => {
              console.log('Hours update success ' +result);
              this.refreshTimesheetData(); 
                })
                .catch((error) => {
                  console.error(error);
                });
                
                this.refreshTimesheetData(); 
          })
          .catch((error) => {
            console.error(error);
          });
          
       
        }
    /*handleTimesheetData(taskId, day, hoursWorked) {
        console.log('Save Timesheet Click '+' day '+day+' taskId '+taskId+' hoursWorked '+hoursWorked);
        if(this.isSubmitted===true)
        {
        this.showToast('Error', 'Timesheet is already submitted. It cannot be edited.', 'error');
        return;
        }
        if (hoursWorked) {
        const tasksPerDayData = []; 
        this.taskToDisplay.forEach((taskPerDay) => {
          const existingTask = taskPerDay.ExistingTask;  //avoid adding existing Tasks_Per_Day__c 
          console.log('existingTask '+existingTask);
          const taskData = {
            sobjectType: 'Tasks_Per_Day__c',
            Task__c: taskPerDay.Action__c,
            Day_Time_Entry__c: this.dayTimeEntry.Id,
            Project__c: taskPerDay.Project__c
          };
          console.log('taskData '+taskData);          
          if (existingTask) {
            taskData.Id = existingTask.Id;
          }
          tasksPerDayData.push(taskData);       //Store new Tasks_Per_Day__c records
        }); 
        const tasksPerDayRecords = [];
        const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT','SUN'];
        const dates = [];
        const startDate = new Date(this.weekStartDate);
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          dates.push(date);
        }
        const dayOfWeek = weekdays.indexOf(day); 
        dates.forEach((date, index) => {
          if (index === dayOfWeek) { // Only process the specified day
            const dayTaskData = { ...tasksPerDayData[index] };
            dayTaskData.Day_Date__c = date.toISOString().slice(0, 10);
            dayTaskData.Task__c=taskId;
            //dayTaskData.Project__c=projectId;
            dayTaskData.Hours_Worked__c = hoursWorked;
            tasksPerDayRecords.push(dayTaskData);
          }
        });  
        console.log('success');
        console.log(this.weekStartDate);
        console.log(tasksPerDayRecords);
        createTasksPerDay({ tasksPerDayData: tasksPerDayRecords,userId:this.resourceId,weekStartDate:this.weekStartDate,weekEndDate:this.weekEndDate})
          .then((result) => {
            console.log('createTasksPerDay '+result);
            updateHoursCount({taskId,userId:this.resourceId,weekStartDate:this.weekStartDate,weekEndDate:this.weekEndDate})
          .then((result) => {
              console.log('Hours update success ' +result);
              this.refreshTimesheetData(); 
                })
                .catch((error) => {
                  console.error(error);
                });
            this.refreshTimesheetData(); 
          })
          .catch((error) => {
            console.error(error);
          });
          
        }
         
      }*/
      handleWorkingHourChange(event)
      {
        const hoursWorked = event.target.value;
        const taskId = event.target.dataset.taskId;
        //const projectId = event.target.dataset.projectId;
        const date=event.target.dataset.day;
        const dayIndex = (new Date(date)).getDay();
        const daysOfWeek = ['SUN','MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const day = daysOfWeek[dayIndex];
        console.log('hoursWorked '+hoursWorked+' day '+day+' taskId '+taskId);
        
        this.handleTimesheetData(taskId,day,hoursWorked);
      }
      /*handleWorkingHourChange(event,taskId,day,projectId)
      {
        const hoursWorked = event.target.value;
        console.log('taskId '+taskId+' hoursWorked: '+hoursWorked+' Day: '+day)
        this.handleTimesheetData(taskId, day, hoursWorked,projectId);
      }
      handleMonHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId; 
        this.handleWorkingHourChange(event,taskId,'MON',projectId);
      }
      handleTueHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId;
        this.handleWorkingHourChange(event,taskId,'TUE',projectId);
      }
      handleWedHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId;
        this.handleWorkingHourChange(event,taskId,'WED',projectId);
      }
      handleThuHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId;
        this.handleWorkingHourChange(event,taskId,'THU',projectId);
      }
      handleFriHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId;
        this.handleWorkingHourChange(event,taskId,'FRI',projectId);
      }
      handleSatHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId;
        this.handleWorkingHourChange(event,taskId,'SAT',projectId);
      }
      handleSunHourChange(event) {
        const taskId = event.target.dataset.taskId;
        const projectId = event.target.dataset.projectId;
        this.handleWorkingHourChange(event,taskId,'SUN',projectId);
      }*/
      handleSearch(event) {
        this.searchKeyword = event.target.value.toLowerCase();
        searchActions({searchKeyword: this.searchKeyword})
            .then(result => {
                this.filteredActions = result;
                console.log(result);
                console.log('Result'+result);
            })
            .catch(error => {
                console.error('Error retrieving filtered actions:', error);
            });
    }  
    handleProjectChange(event)
    {
      this.selectedProjectId=event.target.value;
      console.log(this.selectedProjectId);
      getTasks({projectId:this.selectedProjectId})
      .then((result) => {
        this.taskOptions = result.map((task) => ({
          label: task.Name,
          value: task.Id
        }));
        console.log(result);
        console.log(this.taskOptions);
    })
    .catch(error=>{
      console.error(error);
    });
}  
    handleTaskChange(event)
    {
      console.log('Task');
      this.selectedTaskId=event.target.value;
      console.log(this.selectedTaskId);
    } 
    handleSave() {
      console.log('Save click');
      console.log(this.selectedProjectId+' '+this.selectedTaskId);
      /*if(this.isSubmitted===true)
      {
        this.showToast('Error', 'Timesheet is already submitted. It cannot be edited.', 'error');
        return;
      }*/
      const dayOfWeek = this.selectedDate.getDay();
        console.log(dayOfWeek);
        const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const selectedDayName = weekdays[dayOfWeek];
        console.log(selectedDayName);
        const weekStartDate = new Date(this.selectedDate);
        weekStartDate.setDate(this.selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        console.log(weekStartDate);
        const weekEndDate = new Date(this.selectedDate);
        weekEndDate.setDate(this.selectedDate.getDate() + (7 - this.selectedDate.getDay()));
        console.log(weekEndDate);
        this.weekStartDate = weekStartDate.toISOString().slice(0, 10);
        this.weekEndDate = weekEndDate.toISOString().slice(0, 10);
        console.log(this.weekStartDate);
        console.log(this.weekEndDate);
        console.log('Go click');
        const dates=[];
        for(let i=0;i<7;i++)
        {
            const date=new Date(weekStartDate);
            date.setDate(date.getDate()+i);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            dates.push(formattedDate);
        }
        this.monDate=`${dates[0]}`;
        this.tueDate=`${dates[1]}`;
        this.wedDate=`${dates[2]}`;
        this.thurDate=`${dates[3]}`;
        this.friDate=`${dates[4]}`;
        this.satDate=`${dates[5]}`;
        this.sunDate=`${dates[6]}`;
        console.log(this.monDate);
        this.displayweekStartDate=this.weekStartDate;
        this.handleTimesheetData();
        updatedTimesheet({ selectedTaskId: this.selectedTaskId, userId: this.resourceId, weekStartDate: this.weekStartDate, weekEndDate: this.weekEndDate, selectedDate: this.selectedDate, selectedDay: selectedDayName })
        .then(result=>{
          if (result === 'TaskAlreadyExists') {
            this.showToast('Error', 'The task is already present in your timesheet.', 'error');
          }
          else if(result==='Timesheet Submitted'){
            this.showToast('Error','Timesheet is already submitted. It cannot be edited','error');
            return;
          } else { 
            this.refreshTimesheetData(); 
            this.showToast('success', 'New Task is added in your Timesheet', 'success');
            console.log('Success');
            this.refreshTimesheetData(); 
          }
            
        })
        .catch(error=>{
            console.error(error);
        });
         
    }
    
    handleClose(){
      if(this.isSubmitted===true)
      {
        this.showToast('Error', 'Timesheet is already submitted. It cannot be edited.', 'error');
        return;
      }
      console.log('Close click');
      this.selectedProjectId = '';
      this.selectedTaskId = '';
    }
    handleTimesheetSubmission()
    {
        console.log('Submit Timesheet');
        updateTimesheetStatus({userId: this.resourceId, weekStartDate: this.weekStartDate, weekEndDate: this.weekEndDate})
        .then((result)=>{
          if(result==='Timesheet Submitted'){
            this.showToast('Error','Timesheet is already submitted. It cannot be edited','error');
            return;
          } else { 
          console.log('Successs');
          this.isSubmitted = true;
          this.showToast('Success', 'Timesheet submitted successfully.', 'success');
          this.refreshTimesheetData();
          }
        })
        .catch((error)=>{
          console.log('error');
        });
      
}
handleEdit(event)
{
  console.log('Success Edit');
  const timesheetTaskId = event.target.dataset.timesheettaskId;
  console.log('timesheetTaskId '+timesheetTaskId);
  this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
      recordId: timesheetTaskId,
      actionName: 'edit'
      }
  });
}
handleDelete(event) {
  console.log('Success Delete');
  const timesheetTaskId = event.target.dataset.timesheettaskId;
  console.log('timesheetTaskId ' + timesheetTaskId);
  deleteTimesheetTask({ timesheetTaskId })
    .then((result) => {
      if(result==='Timesheet Submitted'){
        this.showToast('Error','Timesheet is already submitted. It cannot be edited','error');
        return;
      } else { 
      console.log('Task deleted successfully');
      this.showToast('Success', 'Task Deleted', 'success');
      refreshApex(this.timesheetResult);
      }
    })
    .catch(error => {
      console.error('Error deleting task:', error);
    });
    //this.refreshTimesheetData();
    
}
showToast(title, message, variant)
    {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }
}