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
            console.log(this.logs.printFullLog())
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

            logConfig.acceptedProjects = this.getProjects(); /* Ошибка в логе */

            this.distributeProjects(); 

            logConfig.dismissedDeveloper = this.dismissFreeDeveloper();

            this.recalculateDevelopersDay();

            logConfig.finishedProjects = this.deleteFinishedProjects(); /* Ошибка в функции */

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
                    let departament = this.identifyDepartament(newDeveloper);

                    departament.acceptWorker(newDeveloper);
                    newDevelopers.push(newDeveloper);
                });
                this.needAccept = [];
            }

            return newDevelopers;
        }

        distributeProjects() {
            if(!this.projects.length) return;
            let projects = this.projects.filter(p => p.process.ACCEPTED);
            let testedProjects = this.projects.filter(p => p.process.TESTED);

            if(projects.length) {
                projects.forEach(project => {
                    let departament = this.identifyDepartament(project);
                    
                    let canTake = departament.takeProject(project);

                    if( !canTake ) {
                        let developerClass = null;

                        if(project instanceof WebProject) {
                            developerClass = WebDeveloper;
                        } else {
                            developerClass = MobileDeveloper;
                        }
                        if( developerClass ) {
                            this.needAccept.push(developerClass);
                        }
                    }
                }) 
            }

            if(testedProjects.length) {
                testedProjects.forEach(project => {
                    let canTake = this.qaDepartament.takeProject(project);

                    if( !canTake ) {
                        this.needAccept.push(QaDeveloper);
                    }
                })
            }        
        }

        dismissFreeDeveloper() {
            let dismissed = this.searchDismissedDeveloper();

            if( !dismissed ) return false;

            let departament = this.identifyDepartament(dismissed);

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
            this.developers.push(worker);
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

            if(!freeDevelopers.length) return false;

            freeDevelopers[0].toDoWork(project, project.getDays(1));

            project.setProcess('DISTRIBUTED');

            return true;
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

            if(!freeDevelopers.length) return false;

            if(freeDevelopers.length >= difficult) {
                workersAmount = difficult;
            }

            let workers = freeDevelopers.filter((item, index) => index < workersAmount);
            workers.forEach(dev => {
                dev.toDoWork(project, project.getDays(workersAmount));
            })

            return true;
        }

    }

    class QaDepartament extends Departament {

        constructor() {
            super();
        }

        takeProject(project) {
            let freeDevelopers = this.freeDevelopers();

            if(!freeDevelopers.length) return false;

            freeDevelopers[0].toDoWork(project, 1);
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
            return this.difficult / workersAmount;
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

        printFullLog() {
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
    
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    new WebCompany(100);

})()