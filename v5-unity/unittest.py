import pg_logger
import json

class UnitTester:

    __final_output = []

    def __json_finalizer(self,input_code, output_trace):
        self.__final_output = output_trace

    def test_code_by_task(self,code, task, code_correct, answer_keyword):
        result = {'status': False, 'test_answer': '', 'correct_answer': '', 'exception_msg': ''}

        try:
            options = '{"cumulative_mode": "False","heap_primitives":"False", "show_only_outputs": "True"}'
            #------------------------------------------------------------------------------------------
            # All task should have at least one output
            pg_logger.exec_script_str_igor(code_correct, task, options, self.__json_finalizer)
            last_output = (self.__final_output[len(self.__final_output) - 1]).get('stdout')
            result['correct_answer'] = last_output[last_output.find(answer_keyword):]

            #------------------------------------------------------------------------------------------

            pg_logger.exec_script_str_igor(code, task, options, self.__json_finalizer)
            test_answer = self.__final_output

            #------------------------------------------------------------------------------------------
            if not test_answer:
                result['exception_msg'] = 'No output at all'
                return result

            # error message could be None, empty and with data
            exception_msg = (test_answer[len(test_answer) - 1]).get('exception_msg')

            if not exception_msg:
                last_output = (test_answer[len(test_answer) - 1]).get('stdout')

                if last_output:
                    position = last_output.find(answer_keyword)
                    if position >= 0:
                        result['test_answer'] = last_output[position:]
                        result['status'] = (result['test_answer'] == result['correct_answer'])
                        if not result['status']:
                            result['exception_msg'] = 'Not correct answer'
                    else:
                        result['exception_msg'] = 'No keyword found'
                else:
                    result['exception_msg'] = 'No output at all'
            else:
                result['exception_msg'] = exception_msg

        except Exception as ex:
            result['exception_msg'] = ex
            result['status'] = False
        finally:
            return result

    def test(self,code,tasks,code_correct,answer_keyword):
        json_tests = json.loads(tasks)

        response = {}

        for task_id in json_tests:
            task = json_tests[task_id]
            response[task_id] = self.test_code_by_task(code, task, code_correct, answer_keyword)

        return json.dumps(response)



'''

answer_keyword = "Answer:"
code = 'x = int(input())\ny = int(input())\nprint("Answer:ok",x+12*y)'
code_correct = 'x = int(input())\ny = int(input())\nprint("Answer:ok",x+12*y)'


code = 'x=int(input())\ny=int(input())\nprint("Answer:ok1",y,x)'

code_correct = 'x=int(input())\ny=int(input())\nprint("Answer:ok1",y,0)'

tasks = '{"id1":{"0":"11","1":"1"},"id2":{"0":"111","1":"2"},"id3":{"0":"0","1":"2"}}'

x = UnitTester()
print(x.test(code, tasks, code_correct, answer_keyword))

'''