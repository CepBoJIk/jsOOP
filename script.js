(function() {

    

    class WebCompany {

        constructor(daysAmount) {

            this.director = new Director();

            while( daysAmount > 0 ) {

                this.director.changeDay();
                daysAmount--;

            }

            this.director.logs.getFullLog();
            console.log(this.director.logs.printFullLog());

        }
    }

    class Director {

        constructor() {
            this.projects = [];
            this.needAccept = [];
            // this.newProjects = [];
            // this.finishedProjectsAtDay = [];
            // this.newDevelopers = [];
            // this.dismissedDeveloper = {};
            this.webDepartament = new WebDepartament();
            this.mobileDepartament = new MobileDepartament();
            this.qaDepartament = new QaDepartament();
            this.logs = new Log();
            this.day = 0;  /* Надо ли? */
            // this.dismissDevelopersInterval = 3;
        }

        changeDay() {
            this.deleteFinishedProjects();

            this.hireDevelopers();

            this.getProjects();

            this.distributeProjects(); 

            this.dismissFreeDeveloper();

            this.developers.recalculateDay();

            this.updateLog();
        }

        getProjects() { 
            let projects = [];
            let projectsAmount = getRandom(0, 5);

            while(projectsAmount-- > 0) {
                let project = Project.generateRandomProject();

                projects.push(project);
            }

            this.projects.push(projects);
        }

        hireDevelopers() {
            if(this.needAccept.length) {
                this.needAccept.forEach((developerClass) => {
                    let newDeveloper = new developerClass();
                    let departament = this.identifyDepartament(newDeveloper);

                    departament.acceptWorker(newDeveloper);
                });

                this.needAccept = [];
            }
        }

        distributeProjects() {
            let newProjects = this.projects.filter(p => p.new);

            newProjects.forEach(project => {

                // Полученные проекты директор пытается передать в отделы учитывая их специализацию

            })

            // for(let i = 0; i < acceptedProjects.length; i++) {

            //     if(acceptedProjects[i].getProcess('TESTED')) {
            //         acceptedProjects[i].type = 'qa';
            //     } 
            //     if(!this.developers.takeProject(acceptedProjects[i])) {
            //         this.needAccept.push(acceptedProjects[i].type);
            //     } else {
            //         acceptedProjects[i].setProcess('DISTRIBUTED');
            //     }
            // }
                    
        }

        dismissFreeDeveloper() {
            let dismissed = this.searchDismissedDeveloper();

            if( !dismissed ) return false;

            let departament = this.identifyDepartament(dismissed);

            if(!departament) return false;

            let index = departament.developers.indexOf(dismissed);
            
            if(index != -1) {
                departament.developers.splice(index, 1);
            }
        };

        searchDismissedDeveloper() {
            let dismissWebDevelopers = this.webDepartament.dismissDevelopers();
            let dismissMobileDevelopers = this.mobileDepartament.dismissDevelopers();
            let dismissQaDevelopers = this.qaDepartament.dismissDevelopers();

            let dismiss = [].concat(dismissWebDevelopers, dismissMobileDevelopers, dismissQaDevelopers);

            if(!dismiss.length) return false;

            dismiss.sort((dev1, dev2) => dev1.projectsAmount - dev2.projectsAmount);

            return dismiss[0];
        }

        identifyDepartament(developer) {
            let departament = null;

            if( developer instanceof WebDeveloper) {
                departament = this.webDepartament;                
            }

            if( developer instanceof MobileDeveloper ) {
                departament = this.mobileDepartament;
            }

            if( developer instanceof QaDeveloper ) {
                departament = this.qaDepartament;
            }

            return departament || false;
        }

        deleteFinishedProjects() {
            let finishedProjects = this.projects.filter((p) => p.finished);

            finishedProjects.forEach(project => {
                let index = this.projects.indexOf(project);

                if(index != -1) this.projects.splice(index, 1);
            })
        }

        updateLog() {
            
            let log = new LogItem(this.day, this.finishedProjectsAtDay, this.newProjects, this.dismissedDevelopers);
            log.day = this.day;
            log.finishedProjects = this.finishedProjectsAtDay;
            log.acceptedProjects = this.newProjects;
            log.dismissedDevelopers = this.dismissedDeveloper;
            log.acceptedDevelopers = this.newDevelopers;
                      
            this.logs.addLog(log);

            console.log(log.printLog());
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

        takeProject(project) {
            // let freeDevelopers = this.freeDevelopers();

            // if(!freeDevelopers.length) return false;

            // freeDevelopers[0].toDoWork(project, project.getDays(1));

            // let amountDevelopers = Math.min(freeDevelopers.length, project.difficult);

            // for(let i = 0; i < amountDevelopers; i++) {
            //     freeDevelopers[i].toDoWork(project, project.getDays(amountDevelopers));
            // }

            // return true;
        }

        recalculateDay() {
            let busyDevelopers = this.busyDevelopers();
            busyDevelopers.forEach(dev => dev.recalculateDaysWork());

            let freeDevelopers = this.freeDevelopers();
            freeDevelopers.forEach(dev => dev.freeDays++);
        }

        dismissDevelopers() {
            return this.freeDevelopers().filter(dev => dev.freeDays > dismissDevelopersInterval);
        }

    }

    class WebDepartament extends Departament {

        constructor() {
            super();
        }

        takeProject(project) {
            let freeDevelopers = this.freeDevelopers();

            if(!freeDevelopers) return false;

            freeDevelopers[0].toDoWork(project, project.getDays(1));

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

            if(!freeDevelopers) return false;

            if(freeDevelopers.length >= difficult) {
                workersAmount = difficult;
            }

            let workers = freeDevelopers.filter((item, index) => index < workersAmount);
            workers.forEach(dev => {
                dev.toDoWork(project, project.getDay(workersAmount));
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

            if(!freeDevelopers) return false;

            freeDevelopers[0].toDoWork(project, 1);
        }
    }

    class Developer {
        constructor(type) {
            this.type = type;
            this.daysWork = 0;
            this.project = {};
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

        constructor(type) {
            super(type);

        }

    }

    class MobileDeveloper extends Developer {

        constructor(type) {
            super(type);

        }

    }

    class QaDeveloper extends Developer {

        constructor(type) {
            super(type);

        }

        recalculateDaysWork() {
            this.daysWork--;

            if(this.free) {
                this.project.setProcess('FINISHED');
                this.project = {};
            }
        }

    }

    class Project {

        constructor(/*type,*/ difficult) {
            this.process = {
                'ACCEPTED': true,
                'DISTRIBUTED': false,
                'TESTED': false,
                'FINISHED': false
            }
            // this.type = type;
            this.difficult = difficult;
            this.new = true;
        }

        get finished() {
            return this.process.FINISHED;
        }

        getDays(workersAmount) {
            return this.difficult / workersAmount;
        }

        getProcess(process) {
            return this.process[process];
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

    class LogItem {
        constructor() {
            this.day;
            this.finishedProjects;
            this.acceptedProjects;
            this.dismissedDevelopers;
            this.acceptedDevelopers;
        }

        get dismissed() {
            if(this.dismissedDevelopers) {
                return this.dismissedDevelopers.type;
            }
            return 'Не стал увольнять, у него жена, дети...';
        }

        getAcceptedDevelopersForType(type) {
            return this.acceptedDevelopers.filter(dev => dev === type);
        }

        printLog() {
            return `День ${this.day}, принято проектов ${this.acceptedProjects.length}, завершено проектов ${this.finishedProjects.length}, 
            принято рабочих ${this.acceptedDevelopers.length}, из них: webDevelopers - ${this.getAcceptedDevelopersForType('web').length}, mobileDevelopers - ${this.getAcceptedDevelopersForType('mobile').length}, qaDevelopers - ${this.getAcceptedDevelopersForType('qa').length}
            уволен рабочий: ${this.dismissed}`
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
            this.days = this.logs.length;

            this.getAllProperties('finishedProjects');
            this.getAllProperties('acceptedProjects');

            this.logs.forEach(log => {
                if(log.dismissedDevelopers) {
                    this.dismissedDevelopers.push(log.dismissedDevelopers)
                }
            });

            this.getAllProperties('acceptedDevelopers');

        }

        getAllProperties(property) {
            this.logs.forEach(log => log[property].forEach(p => this[property].push(p)));
        }

        printFullLog() {
            return `-------------------------------------------
            Всего: дней: ${this.days}, принято проектов ${this.acceptedProjects.length}, завершено проектов ${this.finishedProjects.length},
            уволено рабочих ${this.dismissedDevelopers.length}, принято рабочих ${this.acceptedDevelopers.length} `
        }
    }

    const maxDifficult = 3;

    const projectClasses = [ WebProject, MobileProject ];

    const dismissDevelopersInterval = 3;
    
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    new WebCompany(10);

})()