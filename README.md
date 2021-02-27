# Baskerville Dashboard
A dashboard for the Baskerville project: setup, labelling and feedback.

## How it works

## How to set up and run

### The backend
To have a fully functional Baskerville Dashboard you need to have Baskerville installed and set up. You will need a Baskerville config to continue.
To run the backend, rename the [`config.yaml.example`](backend/conf/config.yaml.example) and fill in the details:

```yaml
---
APP_CONFIG:
  PREFIX: '/api/1'  # if you change this, you'll need to change the baseApiUrl in the front-end `environment.ts`
  SECRET_KEY: 'a very very secret key preferably through an env variable'  # e.g. like this !ENV ${NAME_OF_VAR}
  SQLALCHEMY_COMMIT_ON_TEARDOWN: True
  UPLOAD_FOLDER: '/path/to/uploads'  # should be the full path to static/uploads
  JWT_SECRET_KEY: sosecret
  JWT_DEFAULT_REALM: 'Login Required'
  JWT_AUTH_HEADER_PREFIX: 'Bearer'
  SECURITY_PASSWORD_SALT: 'salt'
  FLASK_DEBUG: True
  ADMIN_EMAIL: 'admin@email'    # the admin details
  ADMIN_PASS: 'secret'
  PIPELINE: 'irawlog'
  BASKERVILLE_CONF: '/path/to/baskerville/conf/yaml'    # the path to your functional Baskerville setup
  KAFKA_TOPICS:
    - 'test.feedback'       # where test is the uuid of your organization, as provided to you by eq. It should be present in baskerville config.
    - 'test.registration'   # you can use environment variables like: - !ENV '${ORG_UUID}.registration'
```
The next step is to run the flask app:
```bash
python app.py
```
The backend should be up and running on http://localhost:5000. You should be able to see `Baskerville-dashboard v0.0.1` in your browser.

*Note: This is the dev server. For deployment, see the options [here](https://flask.palletsprojects.com/en/1.1.x/deploying/))*
Make sure that the communication between the backend, your Baskerville deployment (Spark Cluster, Redis, Kafka, Postgres) and the Prediction Center (through Kafka)
is allowed.

### The front-end
The front-end is developed with Angular (11.1.0 currently). 
To run it:
```bash
# install packages
npm install
# run server
ng serve
```
The website is served on http://localhost:4200

To deploy it and serve it through an NGINX for example you can follow the steps [here](https://angular.io/guide/deployment)


## How to provide feedback
1. Login with the admin account.

![Login screen](data/img/0.%20Login%20Screen.png?raw=true "Login screen")


2. Go to feedback and start by providing some details about the reason for feedback. For example, is it about an attack, or is it about something Baskerville labeled as malicious (bot), while it was normal behavior for your traffic (false positive)? Provide a date range - when this happened - and optionally some more details about it. Please, note that the details are being sent to Baskerville once you finish submitting the feedback in step 3, so make sure you do not include any sensitive data that you don't want Baskerville to have.

![1. Create new feedback context - main img](data/img/1.%20Create%20new%20feedback%20context%20-%20main%20img.png?raw=true "")


![2. Create new feedback context - Select a reason](data/img/2.%20Create%20new%20feedback%20context%20-%20Select%20a%20reason.png?raw=true )

![3. Create new feedback context - add notes](data/img/3.%20Create%20new%20feedback%20context%20-%20add%20notes.png?raw=true )

![4. Choose an existing reason](data/img/4.%20Choose%20an%20existing%20reason.png?raw=true )

3. Step to is to filter out the request sets relevant to your feedback. You can use the filters: app id, IP, target/host, date range, predictions and feedback. You can also upload a csv with IPs to filter out the request sets with those IPs. This works in addition to the other filters, so you can pick a date range and provide a csv and this will result in the request sets that are within the date range and whose IPs are included in the csv only.

![5. Filter out- Filters](data/img/5.%20Filter%20out-%20Filters.png?raw=true )

![6. Filter out - results](data/img/6.%20Filter%20out%20-%20results.png?raw=true )

Low rate attack example:
![8. Filter out - Example of low rate feedback](data/img/8.%20Filter%20out%20-%20Example%20of%20low%20rate%20feedback.png?raw=true )

Not bot feedback example:
![9. Filter out - example of NOT BOT feedback](data/img/9.%20Filter%20out%20-%20example%20of%20NOT%20BOT%20feedback.png?raw=true )


You can navigate through the result pages and click on the action buttons on the right of each request set (bot, not bot, low rate attack), to give individual feedback, or use the checkbox to select all and provide bulk feedback.

![7. Filter out - next pages and Next button](data/img/7.%20Filter%20out%20-%20next%20pages%20and%20Next%20button.png?raw=true )


4. Once you are done labeling, you can hit "Next" at the bottom and go to the final step which is to submit your feedback to Baskerville. On this step, click "SUBMIT" and you are done. The feedback is sent to Baskerville for review and will be used to improve the model.

![10. Submit - before submit screen](data/img/10.%20Submit%20-%20before%20submit%20screen.png?raw=true )


![11. Submit - after submit screen](data/img/11.%20Submit%20-%20after%20submit%20screen.png?raw=true )
