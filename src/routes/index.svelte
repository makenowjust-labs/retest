<script lang="ts">
	import {
		Header,
		Content,
		Grid,
		Row,
		Column,
		Form,
		FormGroup,
		Button,
		NumberInput,
		TextArea,
		Tag,
		StructuredList,
		StructuredListHead,
		StructuredListCell,
		StructuredListBody,
		StructuredListRow,
		InlineLoading,
		SkeletonText
	} from 'carbon-components-svelte';

	import { match, type Match, type MatchResult, type MatchResultMatch } from '$lib/regex';

	let regex: string = '/(foo)|(bar)/';
	let input: string = "'foo'";
	let timeout: number = 1;

	const languages = [
		{
			name: '.NET',
			key: 'dotnet'
		},
		{
			name: 'Java',
			key: 'java'
		},
		{
			name: 'JavaScript',
			key: 'javascript'
		},
		{
			name: 'PCRE',
			key: 'pcre'
		},
		{
			name: 'Perl',
			key: 'perl'
		},
		{
			name: 'Python',
			key: 'python'
		},
		{
			name: 'Ruby',
			key: 'ruby'
		}
	];
	const typeToTagType = {
		match: 'green',
		'no match': 'cool-gray',
		error: 'magenta',
		timeout: 'purple'
	} as const;

	type Result = {
		language: string;
		result: MatchResult | null;
	};
	let results: Result[] | null = null;
	let isMatching = false;

	const formatMatch = (match: Match) => {
		const lines = [];
		lines.push(`index: ${match.index}`);
		lines.push(`indices: ${JSON.stringify(match.indices)}`);
		lines.push(`groups: ${JSON.stringify(match.groups)}`);
		return lines.join('\n');
	};

	const runMatch = async () => {
		isMatching = true;
		try {
			results = [];
			const promises = [];
			for (const [index, language] of languages.entries()) {
				results[index] = {
					language: language.name,
					result: null
				};
				const promise = (async () => {
					const result = await match(language.key, regex, input, timeout);
					results[index].result = result;
				})();
				promises.push(promise);
			}
			await Promise.all(promises);
		} finally {
			isMatching = false;
		}
	};
</script>

<Header company="makenowjust-labs/" platformName="retest" />

<Content>
	<Grid>
		<Row>
			<Column><h1>retest</h1></Column>
		</Row>
		<Row>
			<Column><blockquote><p>regex tester, in many languages, at once</p></blockquote></Column>
		</Row>
	</Grid>
</Content>

<Content>
	<Grid>
		<Row>
			<Column>
				<Form>
					<FormGroup>
						<TextArea
							labelText="regex"
							placeholder="/(foo)|(bar)/"
							rows={2}
							class="bx--type-mono"
							readonly={isMatching}
							bind:value={regex}
						/>
					</FormGroup>
					<FormGroup>
						<TextArea
							labelText="input text"
							placeholder="&#39;foo&#39;"
							helperText="input text is evaluated as JavaScript on your browser."
							rows={2}
							class="bx--type-mono"
							readonly={isMatching}
							bind:value={input}
						/>
					</FormGroup>
					<FormGroup>
						<NumberInput label="Timeout (second)" readonly={isMatching} bind:value={timeout} />
					</FormGroup>
					{#if isMatching}
						<InlineLoading description="Matching..." />
					{:else}
						<Button size="small" on:click={runMatch}>Match</Button>
					{/if}
				</Form>
			</Column>
		</Row>
	</Grid>
	{#if results}
		<Grid padding>
			<Row>
				<Column>
					<StructuredList>
						<StructuredListHead>
							<StructuredListCell head>Language</StructuredListCell>
							<StructuredListCell head>Result</StructuredListCell>
							<StructuredListCell head>Details</StructuredListCell>
							<StructuredListCell head>Time</StructuredListCell>
						</StructuredListHead>
						<StructuredListBody>
							{#each results as { language, result }}
								<StructuredListRow>
									<StructuredListCell>{language}</StructuredListCell>
									{#if result}
										<StructuredListCell>
											<Tag type={typeToTagType[result.type]}>{result.type}</Tag>
										</StructuredListCell>
										<StructuredListCell>
											{#if result.type === 'match'}
												<pre><code>{formatMatch(result.match)}</code></pre>
											{:else if result.type === 'error'}
												{result.message}
											{/if}
										</StructuredListCell>
										<StructuredListCell>{(result.time / 1000).toFixed(3)} s</StructuredListCell>
									{:else}
										<StructuredListCell><Tag skeleton /></StructuredListCell>
										<StructuredListCell><SkeletonText /></StructuredListCell>
										<StructuredListCell><SkeletonText /></StructuredListCell>
									{/if}
								</StructuredListRow>
							{/each}
						</StructuredListBody>
					</StructuredList>
				</Column>
			</Row>
		</Grid>
	{/if}
</Content>
