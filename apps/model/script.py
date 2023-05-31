import time
import redis
from transformers import AutoTokenizer, T5ForConditionalGeneration
import torch


device = torch.device('cuda:0') if torch.cuda.is_available() else None

model = T5ForConditionalGeneration.from_pretrained(
    'mishasadhaker/codet5_large_typescript').to(device)
tokenizer = AutoTokenizer.from_pretrained(
    'mishasadhaker/codet5_large_typescript')

redis_client = redis.Redis(host='redis', port=6379, db=0)

print('Waiting to tasks...')

while True:
    task_id = redis_client.rpop('taskQueue')

    if task_id:
        task = redis_client.hgetall(task_id)
        prompt = task[b'prompt'].decode('utf-8')

        input_ids = tokenizer.encode(prompt, return_tensors='pt').to(device)

        with torch.no_grad():
            output_ids = model.generate(
                input_ids, max_length=200, temperature=0.5, num_beams=5)

        output = tokenizer.decode(output_ids[0], skip_special_tokens=True)

        redis_client.hset(task_id, 'result', output)
        redis_client.hset(task_id, 'status', 'complete')
    else:
        time.sleep(1)
