#!/usr/bin/env bash
# ARAYA Capability Registry Generator
# Run from araya/ root. Generates capability-registry.yaml from repository data.
cd "$(dirname "$0")/../.."
python3 -c "
import yaml, os
with open('araya.yaml') as f:
    config = yaml.safe_load(f)
registry = {
    'generated_from': 'araya.yaml + skills/*/SKILL.md',
    'generated_at': __import__('datetime').datetime.now().isoformat(),
    'total_agents': len(config['agents']),
    'agents': []
}
skill_set = set()
for name, agent in config['agents'].items():
    skills = agent.get('skills', [])
    for s in skills: skill_set.add(s)
    skill_details = []
    for sk in skills:
        sk_path = os.path.join('skills', sk, 'SKILL.md')
        desc = ''
        if os.path.exists(sk_path):
            with open(sk_path) as sf:
                for line in sf.read().split('\n'):
                    line = line.strip()
                    if line and not line.startswith('#') and not line.startswith('---'):
                        desc = line[:120]; break
        skill_details.append({'name': sk, 'description': desc})
    registry['agents'].append({
        'name': name, 'role': agent.get('role', ''),
        'emoji': agent.get('emoji', ''),
        'model_tier': agent.get('model_tier', ''),
        'permissions': agent.get('permissions', {}),
        'capabilities': agent.get('capabilities', []),
        'skills': skill_details, 'skill_count': len(skills),
    })
registry['total_skills'] = len(skill_set)
with open('.araya/organization/capability-registry.yaml', 'w') as f:
    yaml.dump(registry, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
print(f'Registry generated: {registry[\"total_agents\"]} agents, {registry[\"total_skills\"]} skills')
"
