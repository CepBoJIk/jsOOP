(function() {

    

    class WebCompany {

        constructor(daysAmount) {

            this.director = new Director();
            this.logs = new Log();

            while( daysAmount > 0 ) {

                let log = this.director.changeDay();
                log.day = ++this.logs.days;
                console.log(log.printLog());

                this.logs.addLog(log);

                daysAmount--;

            }

            this.logs.getFullLog();
            console.log(this.logs + '');
        }
    }

    class Director {

        constructor() {
            this.projects = [];
            this.needAccept = [];
            this.webDepartament = new WebDepartament();
            this.mobileDepartament = new MobileDepartament();
            this.qaDepartament = new QaDepartament();
        }

        changeDay() {
            let logConfig = {   /* config = { finishedProjects, acceptedProjects, dismissedDevelopers, acceptedDeveloper } */
                finishedProjects: null,
                acceptedProjects: null,
                dismissedDeveloper: null,
                acceptedDevelopers: null
            }

            logConfig.acceptedDevelopers = this.hireDevelopers();

            logConfig.acceptedProjects = this.getProjects();

            this.distributeProjects(); 

            logConfig.dismissedDeveloper = this.dismissFreeDeveloper();

            this.recalculateDevelopersDay();

            logConfig.finishedProjects = this.deleteFinishedProjects(); 

            return new LogItem(logConfig);
        }

        getProjects() { 
            let projectsAmount = getRandom(0, 5);
            let acceptedProjects = [];

            while(projectsAmount-- > 0) {
                let project = Project.generateRandomProject();

                this.projects.push(project);
                acceptedProjects.push(project)
            }

            return acceptedProjects;
        }

        hireDevelopers() {
            let newDevelopers = [];

            if(this.needAccept.length) {
                this.needAccept.forEach((developerClass) => {
                    let newDeveloper = new developerClass();

                    let isAccept = this.departamentsArray.some((dep => {
                        return dep.acceptWorker(newDeveloper);
                    }));

                    if(!isAccept) throw new Error('принят работник неизвестного типа');

                    newDevelopers.push(newDeveloper);
                });
                this.needAccept = [];
            }

            return newDevelopers;
        }

        distributeProjects() {
            if(!this.projects.length) return;

            let projects = this.projects.filter(p => {
                return p.process.ACCEPTED || p.process.TESTED;
            });

            projects.forEach(project => {
                
                let isAccept = this.departamentsArray.some((dep) => {
                    return dep.takeProject(project);
                })

                if( !isAccept ) {
                    let developerClass = null;

                    if(project instanceof WebProject && !project.process.TESTED) {
                        developerClass = WebDeveloper;
                    } else if(project instanceof MobileProject && !project.process.TESTED) {
                        developerClass = MobileDeveloper;
                    } else if(project.process.TESTED) {
                        developerClass = QaDeveloper;
                    }

                    if( developerClass ) {
                        this.needAccept.push(developerClass);
                    } else {
                        throw new Error('Неизвестный тип проекта');
                    }
                }
            })       
        }

        dismissFreeDeveloper() {
            let dismissed = this.searchDismissedDeveloper();

            if( !dismissed ) return false;

            let departament = this.identifyDepartament(dismissed); /* dismissed.identifyDepartament */

            if(!departament) return false;

            let index = departament.developers.indexOf(dismissed);
            
            if(index != -1) {
                departament.developers.splice(index, 1);

                return dismissed;
            }

            return false;
        };

        searchDismissedDeveloper() {
            let dismissWebDevelopers = this.webDepartament.getDismissList();
            let dismissMobileDevelopers = this.mobileDepartament.getDismissList();
            let dismissQaDevelopers = this.qaDepartament.getDismissList();

            let dismiss = [].concat(dismissWebDevelopers, dismissMobileDevelopers, dismissQaDevelopers);

            if(!dismiss.length) return false;

            dismiss.sort((dev1, dev2) => dev1.projectsAmount - dev2.projectsAmount);

            return dismiss[0];
        }

        identifyDepartament( obj ) {
            let departament = null;

            if( obj instanceof WebDeveloper || obj instanceof WebProject) {
                departament = this.webDepartament;            
            }

            if( obj instanceof MobileDeveloper || obj instanceof MobileProject) {
                departament = this.mobileDepartament;
            }

            if( obj instanceof QaDeveloper ) {
                departament = this.qaDepartament;
            }

            return departament || false;
        }

        deleteFinishedProjects() {
            let finishedProjects = this.projects.filter((p) => p.finished);

            if(!finishedProjects.length) return false;

            finishedProjects.forEach(project => {
                let index = this.projects.indexOf(project);

                if(index != -1) {
                    this.projects.splice(index, 1);
                }
            })

            return finishedProjects;
        }

        recalculateDevelopersDay() {
            this.webDepartament.recalculateDay();
            this.mobileDepartament.recalculateDay();
            this.qaDepartament.recalculateDay();
        }

        get departamentsArray() {
            let departamentsArray = [];

            departamentsArray.push(this.webDepartament, this.mobileDepartament, this.qaDepartament);

            return departamentsArray;
        }
    }

    class Departament {

        constructor() {
            this.developers = [];
        }

        freeDevelopers() {
            return this.developers.filter( dev => dev.free );
        }

        busyDevelopers() {
            return this.developers.filter(dev => !dev.free)
        }

        acceptWorker(worker) {
            if(!this.canTakeWorker(worker)) return false;

            this.developers.push(worker);

            return true;
        }

        recalculateDay() {
            let busyDevelopers = this.busyDevelopers();
            busyDevelopers.forEach(dev => dev.recalculateDaysWork());

            let freeDevelopers = this.freeDevelopers();
            freeDevelopers.forEach(dev => dev.freeDays++);
        }

        getDismissList() {
            return this.freeDevelopers().filter(dev => dev.freeDays > dismissDevelopersInterval);
        }

    }

    class WebDepartament extends Departament {

        constructor() {
            super();
        }

        takeProject(project) {
            let freeDevelopers = this.freeDevelopers();

            if(!freeDevelopers.length || !this.canTakeProject(project)) return false;

            freeDevelopers[0].toDoWork(project, project.getDays(1));

            project.setProcess('DISTRIBUTED');

            return true;
        }

        canTakeWorker(worker) {
            return worker instanceof WebDeveloper;
        }

        canTakeProject(project) {
            return project instanceof WebProject && !project.process.TESTED;
        }

    }

    class MobileDepartament extends Departament {

        constructor() {
            super();
        }

        takeProject(project) {
            let freeDevelopers = this.freeDevelopers();
            let difficult = project.difficult;
            let workersAmount = 1;

            if(!freeDevelopers.length || !this.canTakeProject(project)) return false;

            if(freeDevelopers.length >= difficult) {
                workersAmount = difficult;
            }

            let developersAmount = workersAmount;

            while(developersAmount--) {
                let dev = freeDevelopers.shift();
                dev.toDoWork(project, project.getDays(workersAmount));
            }

            return true;
        }

        canTakeWorker(worker) {
            return worker instanceof MobileDeveloper;
        }

        canTakeProject(project) {
            return project instanceof MobileProject && !project.process.TESTED;
        }
    }

    class QaDepartament extends Departament {

        constructor() {
            super();
        }

        takeProject(project) {
            let freeDevelopers = this.freeDevelopers();

            if(!freeDevelopers.length || !this.canTakeProject(project)) return false;

            freeDevelopers[0].toDoWork(project, 1);

            return true;
        }

        canTakeWorker(worker) {
            return worker instanceof QaDeveloper;
        }

        canTakeProject(project) {
            return project.process.TESTED;
        }
    }

    class Developer {
        constructor() {
            this.daysWork = 0;
            this.project = null;
            this.projectsAmount = 0;
            this.freeDays = 0;
        }

        get free() {
            return this.daysWork < 1;
        }

        toDoWork(project, days) {
            this.project = project;
            this.daysWork = days;
            this.freeDays = 0;
        }

        recalculateDaysWork() {
            this.daysWork--;

            if(this.free) {
                if(!this.project) return;

                this.project.setProcess('TESTED');
                this.project = {};
                this.projectsAmount++;
            }
        }

    }



    class WebDeveloper extends Developer {

        constructor() {
            super();

        }
    }

    class MobileDeveloper extends Developer {

        constructor() {
            super();

        }
    }

    class QaDeveloper extends Developer {

        constructor() {
            super();

        }

        recalculateDaysWork() {
            this.daysWork--;

            if(this.free) {
                if(!this.project) return;
                this.project.setProcess('FINISHED');
                this.project = null;
            }
        }

    }

    class Project {

        constructor(difficult) {
            this.process = {
                'ACCEPTED': true,
                'DISTRIBUTED': false,
                'TESTED': false,
                'FINISHED': false
            }
            this.difficult = difficult;
        }

        get finished() {
            return this.process.FINISHED;
        }

        getDays(workersAmount) {
            let days = this.difficult / workersAmount
            if(!isInteger(days)) throw new Error('Не целое число');

            return days;
        }

        setProcess(process) {
            for(let i in this.process) {
                this.process[i] = false;
            }

            this.process[process] = true;
        }
    }

    Project.generateRandomProject = function() {

        let projectClassesAmount = projectClasses.length;
        let difficult = getRandom(1, maxDifficult + 1);
        let projectClass = projectClasses[ getRandom(0, projectClassesAmount)];
        
        return new projectClass(difficult);

    }

    class WebProject extends Project {

        constructor(difficult) {
            super(difficult);
        }
    }

    class MobileProject extends Project {

        constructor(difficult) {
            super(difficult);
        }
        
    }

    class Log {
        constructor() {
            this.logs = [];
            this.days = 0;
            this.finishedProjects = [];
            this.acceptedProjects = [];
            this.dismissedDevelopers = [];
            this.acceptedDevelopers = [];
        }

        addLog(log) {
            this.logs.push(log);
        }

        getFullLog() {
            let logs = this.logs;

            logs.forEach(log => {
                let finishedProjects = log.finishedProjects || [];
                let acceptedProjects = log.acceptedProjects || [];
                let acceptedDevelopers = log.acceptedDevelopers || [];

                let dismissedDeveloper = log.dismissedDeveloper;

                this.getAllProperties(finishedProjects, this.finishedProjects);
                this.getAllProperties(acceptedProjects, this.acceptedProjects);
                this.getAllProperties(acceptedDevelopers, this.acceptedDevelopers);

                if(dismissedDeveloper) {
                    this.dismissedDevelopers.push(dismissedDeveloper);
                }
            });  
        }

        getAllProperties(array, log) {
            array.forEach(obj => {
                log.push(obj)
            })
        }

         toString() {
             return `-------------------------------------------
             Всего: дней: ${this.days}, принято проектов ${this.acceptedProjects.length}, завершено проектов ${this.finishedProjects.length},
             уволено рабочих ${this.dismissedDevelopers.length}, принято рабочих ${this.acceptedDevelopers.length} `
         }
    }

    class LogItem {
        constructor(config) { /* config = { finishedProjects, acceptedProjects, dismissedDevelopers, acceptedDeveloper } */
            this.day = null;
            this.finishedProjects = config.finishedProjects || [];
            this.acceptedProjects = config.acceptedProjects || [];
            this.dismissedDeveloper = config.dismissedDeveloper;
            this.acceptedDevelopers = config.acceptedDevelopers || [];
        }

        get dismissedType() {
            if(this.dismissedDeveloper) {

                if( this.dismissedDeveloper instanceof WebDeveloper ) {
                    return 'Web developer';
                }
                if( this.dismissedDeveloper instanceof MobileDeveloper ) {
                    return 'Mobile developer';
                }
                if( this.dismissedDeveloper instanceof QaDeveloper ) {
                    return 'Qa developer'
                }
            }
            return 'Не стал увольнять, у него жена, дети...';
        }

        getAcceptedDevelopersForType(devClass) {
            return this.acceptedDevelopers.filter(dev => dev instanceof devClass);
        }

        printLog() {
            return `День ${this.day}, принято проектов ${this.acceptedProjects.length}, завершено проектов ${this.finishedProjects.length}, 
            принято рабочих ${this.acceptedDevelopers.length}, из них: webDevelopers - ${this.getAcceptedDevelopersForType(WebDeveloper).length}, mobileDevelopers - ${this.getAcceptedDevelopersForType(MobileDeveloper).length}, qaDevelopers - ${this.getAcceptedDevelopersForType(QaDeveloper).length}
            уволен рабочий: ${this.dismissedType}`
        }
    }

    const maxDifficult = 3;

    const projectClasses = [ WebProject, MobileProject ];

    const dismissDevelopersInterval = 3;

    const isInteger = function(num) {
        return (num ^ 0) === num;
    }
    
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    new WebCompany(100);

})()