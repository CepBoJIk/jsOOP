(function() {

    class WebCompany {

        constructor(daysAmount) {
            this._projectsTypes = ['web', 'mobile'];
            this._maxDifficult = 3;

            this.director = new Director();

            while( daysAmount > 0 ) {
                this.director.day++;

                let projects = this.getProjects();
                
                this.director.giveProjects(projects);
                
                daysAmount--;
            }

            this.director.logs.getFullLog();
            console.log(this.director.logs.printFullLog());
        }

        getProjects() {
            let projects = [];
            let projectsAmount = this.getRandom(0, 5);

            while(projectsAmount-- > 0) {
                let projectTypeNumber = this.getRandom(0, this._projectsTypes.length);
                let projectDifficult = this.getRandom(1, this._maxDifficult + 1);

                let project = new Project(this._projectsTypes[projectTypeNumber], projectDifficult)

                projects.push(project);
            }
            
            return projects;

        }

        getRandom(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

    }

    class Project {

        constructor(type, difficult) {
            this.process = {
                'ACCEPTED': true,
                'DISTRIBUTED': false,
                'TESTED': false,
                'FINISHED': false
            }
            this.type = type;
            this.difficult = difficult;
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

    class Director {

        constructor() {
            this.needAccept = [];
            this.projects = [];
            this.newProjects = [];
            this.finishedProjectsAtDay = [];
            this.newDevelopers = [];
            this.dismissedDeveloper = {};
            this.developers = new Developers();
            this.logs = new Log();
            this.day = 0;
            this.dismissDevelopersInterval = 3;
        }

        giveProjects(projects) {
            this.projects = this.projects.concat(projects);
            this.newProjects = projects;

            if(this.needAccept.length) {
                this.needAccept.forEach((worker) => this.developers.acceptWorker(worker));
                this.newDevelopers = this.needAccept;
                this.needAccept = [];
            }

            this.deleteFinishedProjects();

            if(this.projects.length != 0) {
                this.distributeProjects(this.projects);
            }

            this.dismissedDeveloper = this.developers.dismissFreeDevelopers(this.dismissDevelopersInterval);

            this.developers.recalculateDay();

            this.updateLog();
        }

        distributeProjects(acceptedProjects) {
            for(let i = 0; i < acceptedProjects.length; i++) {

                if(acceptedProjects[i].getProcess('TESTED')) {
                    acceptedProjects[i].type = 'qa';
                } 
                if(!this.developers.takeProject(acceptedProjects[i])) {
                    this.needAccept.push(acceptedProjects[i].type);
                } else {
                    acceptedProjects[i].setProcess('DISTRIBUTED');
                }
            }
            
        }

        deleteFinishedProjects() {
            let finishedProjects = [];

            for(let i = 0; i < this.projects.length; i++) {
                if(this.projects[i].getProcess('FINISHED')) {
                    finishedProjects.push(this.projects[i])
                    this.projects.splice(i, 1);
                    i--;
                }
            }

            this.finishedProjectsAtDay = finishedProjects;
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

    class Developers {

        constructor() {
            this.webDevelopers = [];
            this.mobileDevelopers = [];
            this.qaDevelopers = [];
        }

        freeDevelopers(type) {
            if(!type) {
                let freeWebDevelopers = this.webDevelopers.filter(dev => dev.free);
                let freeMobileDeveloper = this.mobileDevelopers.filter(dev => dev.free);
                let freeQaDevelopers = this.qaDevelopers.filter(dev => dev.free);

                return [].concat(freeWebDevelopers, freeMobileDeveloper, freeQaDevelopers);
            }

            return this[type + 'Developers'].filter( worker => worker.free );
        }

        busyDevelopers() {
            let busyWebDevelopers = this.webDevelopers.filter(dev => !dev.free);
            let busyMobileDevelopers = this.mobileDevelopers.filter(dev => !dev.free);
            let busyQaDevelopers = this.qaDevelopers.filter(dev => !dev.free);

            return [].concat(busyWebDevelopers, busyMobileDevelopers, busyQaDevelopers);
        }

        acceptWorker(workerType) {
            switch(workerType) {
                case 'web': 
                    this.webDevelopers.push(new WebDeveloper('web'));
                    break;
                case 'mobile': 
                    this.mobileDevelopers.push(new MobileDeveloper('mobile'));
                    break;
                case 'qa': 
                    this.qaDevelopers.push(new QADeveloper('qa'));
                    break;
            }
        }

        takeProject(project) {
            let projectType = project.type;
            let freeDevelopers = this.freeDevelopers(projectType);

            if(!freeDevelopers.length) return false;

            switch(projectType) {
                case 'web':
                    freeDevelopers[0].toDoWork(project, project.getDays(1));
                    break;
                case 'mobile':
                    let amountDevelopers = Math.min(freeDevelopers.length, project.difficult);

                    for(let i = 0; i < amountDevelopers; i++) {
                        freeDevelopers[i].toDoWork(project, project.getDays(amountDevelopers));
                    }
                    break;
                case 'qa':
                    freeDevelopers[0].toDoWork(project, 1)
                    break;
            }

            return true;
        }

        recalculateDay() {
            let busyDevelopers = this.busyDevelopers();
            busyDevelopers.forEach(dev => dev.recalculateDaysWork());

            let freeDevelopers = this.freeDevelopers();
            freeDevelopers.forEach(dev => dev.freeDays++);
        }

        dismissFreeDevelopers(freeDaysAmount) {
            let dismiss = this.freeDevelopers().filter(dev => dev.freeDays > freeDaysAmount);
            let dismissed = {};
            let dismissedIndex;

            if(!dismiss.length) return false;

            dismiss.sort((dev1, dev2) => dev1.projectsAmount - dev2.projectsAmount);
            dismissed = dismiss[0];

            dismissedIndex = this[dismissed.type + 'Developers'].indexOf(dismissed);

            if(dismissedIndex != -1) {
                this[dismissed.type + 'Developers'].splice(dismissedIndex, 1);
                return dismissed;
            }

            return false;
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

    class QADeveloper extends Developer {

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

    new WebCompany(10);

})()