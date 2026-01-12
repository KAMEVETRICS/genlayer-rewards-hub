# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Submission:
    submitter: Address
    content_url: str
    status: str
    rejection_reason: str


@allow_storage
@dataclass
class Contest:
    creator: Address
    platform_pattern: str
    required_topic: str
    reward_description: str
    max_winners: bigint
    deadline: bigint
    accepted_count: bigint
    is_active: bool


class ContentRewards(gl.Contract):
    contests: TreeMap[str, Contest]
    # Simplified: store submissions as a flat map with composite key "contestId:address"
    submissions: TreeMap[str, Submission]
    # Store submission addresses per contest as comma-separated string
    submission_addresses: TreeMap[str, str]
    next_contest_id: bigint

    def __init__(self):
        self.next_contest_id = bigint(0)

    def _validate_content(self, content_url: str, platform_pattern: str, required_topic: str) -> bool:
        # Check platform pattern first (deterministic check)
        if platform_pattern != "*":
            if platform_pattern.lower() not in content_url.lower():
                return False

        def validate_submission() -> str:
            web_data = ""
            fetch_method = ""

            # Method 1: Try mode="text" first (best for readable content)
            try:
                web_data = gl.nondet.web.render(content_url, mode="text")
                if web_data and len(web_data.strip()) > 50:
                    fetch_method = "text content"
            except Exception:
                web_data = ""

            # Method 2: If text failed, try mode="html" for metadata
            if not web_data or len(web_data.strip()) < 50:
                try:
                    html_data = gl.nondet.web.render(content_url, mode="html")
                    if html_data and len(html_data.strip()) > 100:
                        web_data = html_data
                        fetch_method = "HTML metadata"
                except Exception:
                    pass

            # Method 3: If both failed, use URL-based validation
            if not web_data or len(web_data.strip()) < 50:
                fetch_method = "URL analysis only"
                # Extract potential keywords from URL
                web_data = f"URL to analyze: {content_url}"

            # Use LLM to validate topic relevance
            task = f"""
You are evaluating if content is related to a topic for a rewards program.
Data source: {fetch_method}

Required Topic: {required_topic}

Content URL: {content_url}

{"Fetched Content:" if fetch_method != "URL analysis only" else ""}
{web_data[:8000]}

VALIDATION RULES:
1. If the URL contains keywords related to the topic - ACCEPT
2. If the fetched content mentions the topic - ACCEPT
3. Social media posts about the topic ARE VALID even if brief
4. Only REJECT if clearly unrelated or spam
5. When in doubt, ACCEPT

Answer only: YES or NO
"""
            return gl.nondet.exec_prompt(task)

        # Use comparative equivalence - validators compare if their answers are equivalent
        comparison_prompt = """
Two validators evaluated whether content is related to a topic.
Do they reach the same conclusion (both accept OR both reject)?

Validator 1 said: {principal}
Validator 2 said: {other}

Answer only YES if they agree, NO if they disagree.
"""
        result = gl.eq_principle.prompt_comparative(validate_submission, comparison_prompt)

        # Check if result indicates valid content
        result_lower = result.lower().strip()
        return "yes" in result_lower or "valid" in result_lower or "accept" in result_lower

    @gl.public.write
    def create_contest(
        self,
        platform_pattern: str,
        required_topic: str,
        reward_description: str,
        max_winners: int,
        deadline: int
    ) -> int:
        contest_id = int(self.next_contest_id)
        self.next_contest_id = bigint(contest_id + 1)

        contest = Contest(
            creator=gl.message.sender_address,
            platform_pattern=platform_pattern,
            required_topic=required_topic,
            reward_description=reward_description,
            max_winners=bigint(max_winners),
            deadline=bigint(deadline),
            accepted_count=bigint(0),
            is_active=True
        )

        contest_key = str(contest_id)
        self.contests[contest_key] = contest
        # Initialize empty submission addresses for this contest
        self.submission_addresses[contest_key] = ""

        return contest_id

    @gl.public.write
    def submit_content(self, contest_id: int, content_url: str) -> dict:
        contest_key = str(contest_id)

        if contest_key not in self.contests:
            raise Exception("Contest does not exist")

        contest = self.contests[contest_key]

        if not contest.is_active:
            raise Exception("Contest is no longer active")

        if int(contest.deadline) > 0:
            current_time = int(gl.message.timestamp)
            if current_time > int(contest.deadline):
                raise Exception("Contest deadline has passed")

        if int(contest.accepted_count) >= int(contest.max_winners):
            raise Exception("Contest has reached maximum winners")

        sender = gl.message.sender_address
        sender_hex = sender.as_hex

        # Create composite key for submission
        submission_key = f"{contest_key}:{sender_hex}"

        # Check if user already submitted
        if submission_key in self.submissions:
            raise Exception("You have already submitted to this contest")

        # Validate the content
        is_valid = self._validate_content(
            content_url,
            contest.platform_pattern,
            contest.required_topic
        )

        # Determine status based on validation and current accepted count
        if is_valid:
            if int(contest.accepted_count) < int(contest.max_winners):
                status = "accepted"
                contest.accepted_count = bigint(int(contest.accepted_count) + 1)
                rejection_reason = ""

                if int(contest.accepted_count) >= int(contest.max_winners):
                    contest.is_active = False
            else:
                status = "voided"
                rejection_reason = "Contest reached maximum winners during validation"
        else:
            status = "rejected"
            rejection_reason = "Content did not meet topic requirements"

        # Store the submission
        submission = Submission(
            submitter=sender,
            content_url=content_url,
            status=status,
            rejection_reason=rejection_reason
        )

        self.submissions[submission_key] = submission

        # Add sender to submission addresses list
        current_addresses = self.submission_addresses.get(contest_key, "")
        if current_addresses:
            self.submission_addresses[contest_key] = current_addresses + "," + sender_hex
        else:
            self.submission_addresses[contest_key] = sender_hex

        return {
            "status": status,
            "reason": rejection_reason if rejection_reason else "Content accepted"
        }

    @gl.public.write
    def close_contest(self, contest_id: int) -> None:
        contest_key = str(contest_id)

        if contest_key not in self.contests:
            raise Exception("Contest does not exist")

        contest = self.contests[contest_key]

        if gl.message.sender_address != contest.creator:
            raise Exception("Only contest creator can close the contest")

        contest.is_active = False

    @gl.public.view
    def get_contest(self, contest_id: int) -> dict:
        contest_key = str(contest_id)

        if contest_key not in self.contests:
            raise Exception("Contest does not exist")

        contest = self.contests[contest_key]

        return {
            "contest_id": contest_id,
            "creator": contest.creator.as_hex,
            "platform_pattern": contest.platform_pattern,
            "required_topic": contest.required_topic,
            "reward_description": contest.reward_description,
            "max_winners": int(contest.max_winners),
            "deadline": int(contest.deadline),
            "accepted_count": int(contest.accepted_count),
            "is_active": contest.is_active,
            "spots_remaining": int(contest.max_winners) - int(contest.accepted_count)
        }

    @gl.public.view
    def get_all_contests(self) -> list:
        result = []
        for contest_key, contest in self.contests.items():
            result.append({
                "contest_id": int(contest_key),
                "creator": contest.creator.as_hex,
                "platform_pattern": contest.platform_pattern,
                "required_topic": contest.required_topic,
                "reward_description": contest.reward_description,
                "max_winners": int(contest.max_winners),
                "deadline": int(contest.deadline),
                "accepted_count": int(contest.accepted_count),
                "is_active": contest.is_active,
                "spots_remaining": int(contest.max_winners) - int(contest.accepted_count)
            })

        return result

    @gl.public.view
    def get_submissions(self, contest_id: int) -> list:
        contest_key = str(contest_id)

        if contest_key not in self.contests:
            raise Exception("Contest does not exist")

        result = []

        # Get addresses that submitted to this contest
        addresses_str = self.submission_addresses.get(contest_key, "")
        if not addresses_str:
            return result

        addresses = addresses_str.split(",")

        for addr_hex in addresses:
            if not addr_hex:
                continue
            submission_key = f"{contest_key}:{addr_hex}"
            if submission_key in self.submissions:
                sub = self.submissions[submission_key]
                result.append({
                    "submitter": sub.submitter.as_hex,
                    "content_url": sub.content_url,
                    "status": sub.status,
                    "rejection_reason": sub.rejection_reason
                })

        return result

    @gl.public.view
    def get_winners(self, contest_id: int) -> list:
        contest_key = str(contest_id)

        if contest_key not in self.contests:
            raise Exception("Contest does not exist")

        winners = []

        addresses_str = self.submission_addresses.get(contest_key, "")
        if not addresses_str:
            return winners

        addresses = addresses_str.split(",")

        for addr_hex in addresses:
            if not addr_hex:
                continue
            submission_key = f"{contest_key}:{addr_hex}"
            if submission_key in self.submissions:
                sub = self.submissions[submission_key]
                if sub.status == "accepted":
                    winners.append(sub.submitter.as_hex)

        return winners

    @gl.public.view
    def get_user_submission(self, contest_id: int, user_address: str) -> dict:
        contest_key = str(contest_id)

        if contest_key not in self.contests:
            raise Exception("Contest does not exist")

        submission_key = f"{contest_key}:{user_address}"

        if submission_key not in self.submissions:
            return {"has_submitted": False}

        sub = self.submissions[submission_key]
        return {
            "has_submitted": True,
            "content_url": sub.content_url,
            "status": sub.status,
            "rejection_reason": sub.rejection_reason
        }
