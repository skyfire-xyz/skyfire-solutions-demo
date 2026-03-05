# crew.py
from crewai import Agent, Crew, Task, Process
from tools import SkyfireCreateKYATokenTool, DappierRealtimeSearchTool

QUERY = "Latest AI news today, include date and time"

agent = Agent(
    role="General purpose agent",
    goal="Get a Skyfire KYA token and use it to do a Dappier real-time search.",
    backstory="You are a careful tool-using agent that follows steps exactly.",
    verbose=True,
    tools=[SkyfireCreateKYATokenTool(), DappierRealtimeSearchTool()],
)

task_get_token = Task(
    description=(
        "Call the tool `skyfire_create_kya_token` to create a KYA token. "
        "Return ONLY the token string."
    ),
    expected_output="A single token string.",
    agent=agent,
)

task_search = Task(
    description=(
        "Use the token from the previous step and call `dappier_realtime_search`.\n"
        f"- query: {QUERY}\n"
        "Return the search results."
    ),
    expected_output="Search results as text.",
    agent=agent,
    context=[task_get_token],  # makes prior output available
)

crew = Crew(
    agents=[agent],
    tasks=[task_get_token, task_search],
    process=Process.sequential,
    verbose=True,
)