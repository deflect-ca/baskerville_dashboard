# baskerville_dashboard
A dashboard for the Baskerville project: setup, labelling and feedback

## How it works

## How to set up and run

## How to provide feedback
1. Login with the admin account.
![Login screen](/data/0. Login Screen.png?raw=true "")


2. Go to feedback and start by providing some details about the reason for feedback. For example, is it about an attack, or is it about something Baskerville labeled as malicious (bot), while it was normal behavior for your traffic (false positive)? Provide a date range - when this happened - and optionally some more details about it. Please, note that the details are being sent to Baskerville once you finish submitting the feedback in step 3, so make sure you do not include any sensitive data that you don't want Baskerville to have.

![1. Create new feedback context - main img](/data/1. Create new feedback context - main img.png?raw=true "")


![2. Create new feedback context - Select a reason](/data/2. Create new feedback context - Select a reason.png?raw=true )

![3. Create new feedback context - add notes](/data/3. Create new feedback context - add notes.png?raw=true )

![4. Choose an existing reason](/data/4. Choose an existing reason.png?raw=true )

3. Step to is to filter out the request sets relevant to your feedback. You can use the filters: app id, IP, target/host, date range, predictions and feedback. You can also upload a csv with IPs to filter out the request sets with those IPs. This works in addition to the other filters, so you can pick a date range and provide a csv and this will result in the request sets that are within the date range and whose IPs are included in the csv only.

![5. Filter out- Filters](/data/5. Filter out- Filters.png?raw=true )

![6. Filter out - results](/data/6. Filter out - results.png?raw=true )

![7. Filter out - next pages and Next button](/data/7. Filter out - next pages and Next button.png?raw=true )

![8. Filter out - Example of low rate feedback](/data/8. Filter out - Example of low rate feedback.png?raw=true )

![9. Filter out - example of NOT BOT feedback](/data/9. Filter out - example of NOT BOT feedback.png?raw=true )


You can navigate through the result pages and click on the action buttons on the right of each request set (bot, not bot, low rate attack), to give individual feedback, or use the checkbox to select all and provide bulk feedback.

4. Once you are done labeling, you can hit "Next" at the bottom and go to the final step which is to submit your feedback to Baskerville. On this step, click "SUBMIT" and you are done. The feedback is sent to Baskerville for review and will be used to improve the model.

![10. Submit - before submit screen](/data/10. Submit - before submit screen.png?raw=true )


![11. Submit - after submit screen](/data/11. Submit - after submit screen.png?raw=true )
