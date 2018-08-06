(function() {

    class WebCompany {

        constructor(daysAmount) {
            this.projectsTypes = ['web', 'mobile'];
            this.maxDifficult = 3;

            this.director = new Director();

            while( daysAmount > 0 ) {
                let projects = this.getProjects();
                
                this.director.giveProjects(projects);
                
                daysAmount--;
            }

        }

        getProjects() {
            let projects = [];
            let projectsAmount = this.getRandom(0, 5);

            while(projectsAmount-- > 0) {
                let projectTypeNumber = this.getRandom(0, this.projectsTypes.length);
                let projectDifficult = this.getRandom(1, this.maxDifficult + 1);

                let project = new Project(this.projectsTypes[projectTypeNumber], projectDifficult)

                projects.push(project);
            }
            
            return projects;

        }

        getRandom(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

    }

    /* Класс проекта */

    class Project {

        constructor(type, difficult) {
            this.type = type;
            this.difficult = difficult;
        }

        getDays(workersAmount) {
            return this.difficult / workersAmount;
        }
    }

    class Director {

        constructor() {
            this.needAccept = [];

            this.projects = [];
            this.distributedProjects = [];

            this.developers = new Developers();
        }

        giveProjects(projects) {
            this.projects = this.projects.concat(projects);

            if(this.developers.busyDevelopers().length) {
                for(let devs in this.developers.busyDevelopers()) {
                    this.developers.busyDevelopers[devs].forEach((i) => i.recalculateDays);
                }
            }   

            if(this.needAccept.length) {
                this.needAccept.forEach((worker, i) => this.developers.acceptWorker(this.needAccept[i]));
                this.needAccept = [];
            }

            if(this.projects.length != 0) {
                this.distributeProjects();
            }

        }

        distributeProjects() {

            for(let i = 0; i < this.projects.length; i++) {

                if(!this.developers.takeProject(this.projects[i])) {
                    this.needAccept.push(this.projects[i].type);
                } else {
                    this.distributedProjects.push(this.projects.splice(i, 1));
                    --i;    
                }

            }
            
        }

    }

    class Developers {

        constructor() {
            this.webDevelopers = [];
            this.mobileDevelopers = [];
            this.qaDevelopers = [];
        }

        freeDevelopers(type) {
            return this[type + 'Developers'].filter( worker => worker.free );
        }

        busyDevelopers(type) {
            if(!type) return {
                webDevelopers: this.webDevelopers.filter(worker => !worker.free ),
                mobileDevelopers: this.mobileDevelopers.filter(worker => !worker.free ),
                qaDevelopers: this.qaDevelopers.filter(worker => !worker.free)
            }

            return this[type + 'Developers'].filter(worker => !worker.free );
        }

        acceptWorker(workerType) {
            switch(workerType) {
                case 'web': 
                    this.webDevelopers.push(new WebDeveloper());
                break;
                case 'mobile': 
                    this.mobileDevelopers.push(new MobileDeveloper());
                break;
                case 'qa': 
                    this.qaDevelopers.push(new QADeveloper());
                break;
            }
        }

        takeProject(project) {
            let projectType = project.type;

            let developers = this.freeDevelopers(projectType);

            if(!developers.length) return false;

            if(projectType === 'web') {
                developers[0].giveProject(project, project.getDays(1));
            }

            if(projectType === 'mobile') {
                let developersAmount = Math.min(project.difficult, developers.length);
                
                for(let i = 0; i < developersAmount; i++) {
                    developers[i].giveProject(project, project.getDays(developersAmount));
                }
            }

            return true;  
        }
    }

    class Developer {

        constructor() {
            this.daysWork = 0;
            this.project = {};
        }

        giveProject(project, days) {
            this.daysWork += days;
            this.project = project;
        }

        get free() {
            return this.daysWork <  1;
        }

        recalculateDays() {
            this.daysWork--
        }

    }



    class WebDeveloper extends Developer {

        constructor() {
            super();

        }

    }

    class MobileDeveloper extends Developer {

        constructor() {
            super()

        }

    }

    class QADeveloper extends Developer {

        constructor() {
            super()

        }

    }

    new WebCompany(5);

})()