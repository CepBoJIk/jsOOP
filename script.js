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

        get maxWorker() {
            if(this.type === 'web') return this.difficult;
            return 1;
        }

        getDays(workersAmount) {
            return this.difficult / workersAmount;
        }
    }

    class Director {

        constructor() {
            this.needAccept = [];

            this.projects = [];

            this.developers = new Developers();
        }

        giveProjects(projects) {
            this.projects = this.projects.concat(projects);

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
                    this.projects.splice(i, 1);
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

            if(!this.freeDevelopers(projectType).length) return false;

            return true;
            // Код принятия проекта
        }
    }

    class Developer {

        constructor() {
            this.free = true;
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