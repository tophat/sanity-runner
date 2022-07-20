constraints_min_version(1).

gen_enforced_field(WorkspaceCwd, 'repository.type', 'git') :- \+ workspace_field(WorkspaceCwd, 'private', 'true').
gen_enforced_field(WorkspaceCwd, 'repository.url', 'https://github.com/tophat/sanity-runner.git') :- \+ workspace_field(WorkspaceCwd, 'private', 'true').
gen_enforced_field(WorkspaceCwd, 'repository.directory', WorkspaceCwd) :- \+ workspace_field(WorkspaceCwd, 'private', 'true').
