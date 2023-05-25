from transformers import AutoModelForCausalLM, AutoTokenizer
# import torch
import redis
import time

checkpoint = "bigcode/starcoder"
device = 'cpu'  # for GPU usage or "cpu" for CPU usage

tokenizer = AutoTokenizer.from_pretrained(checkpoint)
model = AutoModelForCausalLM.from_pretrained(checkpoint).to(device)

redis_client = redis.Redis(host='localhost', port=6379, db=0)

print('Waiting to tasks...')

while True:
    task_id = redis_client.rpop('taskQueue')

    if task_id:
        task = redis_client.hgetall(task_id)
        prompt = task[b'prompt'].decode('utf-8')

        print(f'prompt: {prompt}')

        inputs = tokenizer.encode(
            "def print_hello_world():", return_tensors="pt").to(device)

        print(f'Generating...')

        outputs = model.generate(inputs)

        output_text = tokenizer.decode(outputs[0])

        print(
            f'Output: {output_text}')

        redis_client.hset(task_id, 'result', output_text)
        redis_client.hset(task_id, 'status', 'complete')
    else:
        time.sleep(1)
